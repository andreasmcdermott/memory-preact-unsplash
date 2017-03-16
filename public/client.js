// client-side js
// run by the browser each time your view template is loaded
// Uses ES2015. This means it will only work in modern browsers.

const {Component, render, h} = window.preact;

const Card = ({card, handleClick}) => h('div', {
    className: `card-wrapper ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`, 
    role: 'button',
    tabIndex: 0,
    'aria-label': `Select card ${card.id}`,
    onClick: () => handleClick(card),
    onKeydown: e => {
      if (e.key === ' ' || e.key === 'Enter') {
        handleClick(card);
      }
    }
  }, [
    h('div', {
      className: `card back ${card.image.format}`,
      style: `background-image: url(${card.image.url});`
    }), 
    h('div', {
      className: `card front`
    })
  ]);

const Board = ({cards, handleClick}) => h('div', {className: 'board box'}, 
  cards.map(card => h(Card, {card, handleClick})));

const Result = ({isGameOver, message, clicks, handleRestart}) => 
  h('div', {className: 'result box'}, [
    h('p', null, message),
    h('p', null, [h('strong', null, 'Turns: '), clicks]),
    isGameOver ? h('p', null, h('button', {onClick: handleRestart}, 'Play again!')) : null
  ]);

class App extends Component {
  constructor(props) {
    super(props);
    
    this.setState(this.getInitialState());
    
    this.handleCardClick = this.handleCardClick.bind(this);
    this.handleRestart = this.handleRestart.bind(this);
  }
  
  getInitialState() {
    const {images} = this.props;
    const duplicatedImages = images.reduce((memo, image) => memo.concat([image, image]), []);
    return {
      cards: shuffleList(duplicatedImages).map((image, i) => ({id: i + 1, image, flipped: false, matched: false})),
      flipped: null,
      clicks: 0,
      foundPair: null
    };
  }
  
  getUserMessage() {
    const {foundPair, flipped} = this.state;
    if (this.isGameOver()) {
      return 'You win!';
    } else if (foundPair === true) {
      return 'Yay, good job!';
    } else if (foundPair === false) {
      return 'Bummer... Try again.';
    } else {
      return 'Pick another card!'
    }
  }
  
  isGameOver() {
    return this.state.cards.every(card => card.matched);
  }
  
  handleRestart() {
    this.setState(this.getInitialState());
  }
  
  handleCardClick(clickedCard) {
    const {flipped} = this.state;
    
    if (clickedCard.matched || (clickedCard.flipped && flipped)) return;
    
    if (!flipped) {
      this.setState(({cards}) => ({
        cards: cards.map(card => ({
          id: card.id, 
          image: card.image, 
          matched: card.matched, 
          flipped: card.matched || card.id === clickedCard.id
        })),
        foundPair: null,
        flipped: clickedCard
      }));
    } else {
      const foundPair = clickedCard.image.url === flipped.image.url;
      
      this.setState(({cards, clicks}) => ({
        cards: cards.map(card => 
          card.id === clickedCard.id || card.id === flipped.id ?
            {id: card.id, image: card.image, matched: foundPair, flipped: true} :
            card
        ),
        foundPair,
        flipped: null,
        clicks: ++clicks
      }));
    }
  }
  
  render(props, {cards, clicks}) {
    return h('div', {className: 'app'}, [
      h(Board, {
        cards, 
        handleClick: this.handleCardClick
      }), 
      h(Result, {
        clicks, 
        message: this.getUserMessage(), 
        isGameOver: this.isGameOver(),
        handleRestart: this.handleRestart
      })
    ]);
  }
}

// Entry point for application
(function start() {
  getImagesByTheme().then(images => {
    render(h(App, {images}), document.getElementById('root'));
  });
}());

// Load images for a random theme
function getImagesByTheme() {
  const themes = ['dogs', 'cats', 'cars', 'motorcycles', 'beach', 'california', 'new-york'];
  const randTheme = Math.floor(Math.random() * themes.length);
  return getImageData(themes[randTheme]);
}

// Use fetch to grab images from unsplash
function getImageData(query) {
  return fetch(`https://api.unsplash.com/search/photos?page=1&per_page=8&query=${query}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Client-ID 28dc5b6849242e9974a1c9ae7b6666bc3013d60cf013ee10c288cdd3e6a9f607' // If remixing, please use your own client id
    }
  })
  .then(res => { 
    if (res.ok) { // 👍
      return res.json(); 
    } else {
      throw Error('Throttled?'); // Unsplash only allows 50 api calls per hour. If we fail, throw an error
    }
  })
  .then(({results}) => results
    .map(({width, height, urls}) => ({
      format: width > height ? 'landscape' : 'portrait', // Used in css to crop image
      url: urls.small
    })))
  .catch(() => getBackupData()); // If error was thrown, use backup data instead.
}

function shuffleList(list) {
  const copy = [...list];
  for (let i = copy.length; i; --i) {
    const r = Math.floor(Math.random() * i);
    [copy[i-1], copy[r]] = [copy[r], copy[i-1]];
  }
  return copy;
}

function getBackupData() {
  return [{
    url: 'https://images.unsplash.com/photo-1443750200537-00fd518bdc82?dpr=2&auto=compress,format&fit=crop&w=376&h=251&q=80&cs=tinysrgb&crop=', 
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1451104726450-0a3d58972500?dpr=2&auto=compress,format&fit=crop&w=376&h=251&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1455287278107-115faab3eafa?dpr=2&auto=compress,format&fit=crop&w=376&h=251&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1426287658398-5a912ce1ed0a?dpr=2&auto=compress,format&fit=crop&w=376&h=250&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1437957146754-f6377debe171?dpr=2&auto=compress,format&fit=crop&w=376&h=376&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1452447224378-04c089d77aa4?dpr=2&auto=compress,format&fit=crop&w=376&h=251&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1415798408244-83edcac0acca?dpr=2&auto=compress,format&fit=crop&w=376&h=250&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1455845694919-f0b3826ea301?dpr=2&auto=compress,format&fit=crop&w=376&h=211&q=80&cs=tinysrgb&crop=',
    format: 'landscape'
  }];
}