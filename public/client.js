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

const Result = ({photographers, isGameOver, message, clicks, handleRestart}) => 
  h('div', {className: 'result box'}, [
    isGameOver ? h('button', {onClick: handleRestart}, 'Play again!') : null,
    h('p', null, message),
    h('p', null, [h('strong', null, 'Turns: '), clicks]),
    h('div', null, [
      h('p', null, ['All photos come from ', h('a', {href: 'https://unsplash.com/'}, 'Unsplash'), '.']),
      h('p', null, h('strong', null, 'The current photos by:')),
      h('p', null, photographers.map(({name, link}) => h('a', {className: 'block', href: link}, name)))
    ])
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
  
  render({images}, {cards, clicks}) {
    return h('div', {className: 'app'}, [
      h(Board, {
        cards, 
        handleClick: this.handleCardClick
      }), 
      h(Result, {
        clicks, 
        message: this.getUserMessage(), 
        isGameOver: this.isGameOver(),
        handleRestart: this.handleRestart,
        photographers: images.map(({user}) => user)
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
    .map(({user, width, height, urls}) => ({
      format: width > height ? 'landscape' : 'portrait', // Used in css to crop image
      url: urls.small,
      user: {
        name: user.name,
        link: user.links.html
      }
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
    url: 'https://images.unsplash.com/photo-1443750200537-00fd518bdc82?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=3a931d3af17a4cb16021583fa0df6148', 
    user: {name: 'Matthew Henry', link: 'http://unsplash.com/@matthewhenry'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1449439338818-435146fcb833?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=161c8a3ab3c1c76db36a63eb8fa308b9',
    user: {name: 'Jez Timms', link: 'http://unsplash.com/@jeztimms'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1445708285800-cef03714a0ef?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=5f244343f704b3eb546f3dc80e9b6be0',
    user: {name: 'Erik Stine', link: 'http://unsplash.com/@charleseriksun'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1451104726450-0a3d58972500?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=f7655bf49ec8cf8a7c98f6fa15cd56bf',
    user: {name: 'Henry Majoros', link: 'http://unsplash.com/@hmojo'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1456534231849-7d5fcd82d77b?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=024548a00a3c652cda7fe5fdabd33d09',
    user: {name: 'meredith hunter', link: 'http://unsplash.com/@mere_hunter'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1456087468887-17b7d7b076e0?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=44e3227a9dea53c1f06bcc83e256e149',
    user: {name: 'Manu Adán', link: 'http://unsplash.com/@neziodsgn'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1469225208447-8329cbd3cb3a?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=5be2026e94b5b43ca944ae2e5e63f813',
    user: {name: 'Ana Silva', link: 'http://unsplash.com/@noqas'},
    format: 'landscape'
  }, {
    url: 'https://images.unsplash.com/photo-1455287278107-115faab3eafa?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&s=0e3f29fb06645c825b35158647947405',
    user: {name: 'Robert Larsson', link: 'http://unsplash.com/@squareddesign'},
    format: 'landscape'
  }];
}