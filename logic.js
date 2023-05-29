function attachCarousel(container) {
  const carousel = bulmaCarousel.attach(container, {
    'autoplay': false, // Autoplay carousel
    'autoplaySpeed': 3000, // Time between each transition when autoplay is active (ms)
    'duration': 300, // Transition animation duration (in ms)
    'effect': 'translate', // Animation effect for item transition (translate|fade)
    'infinite': true, // Activate infinite display mode
    'initialSlide': 0, //Initial item index
    'loop': false, // Activate loop display mode
    'navigation': true, // Display navigation buttons
    'navigationKeys': true, // Enable navigation with arrow keys
    'navigationSwipe': true, // Enable swipe navigation
    'pagination': true, // Display pagination bullets
    'pauseOnHover': true, // Stop autoplay when cursor hover carousel
    'slidesToScroll': 1, // Slide to scroll on each step
    'slidesToShow': 1, // Slides to show at a time
    'timing': 'ease', // Transiation animation type
  })

  window.addEventListener('resize', () => {
    carousel[0].reset()
  })
}

function attachCountdown(container, end) {
  let units = countdown.DAYS | countdown.HOURS | countdown.MINUTES | countdown.SECONDS

  countdown.setFormat({
    singular: ' milliseconde| seconde| minuut| uur| dag| week| maand| jaar| decennium| eeuw| millennium',
    plural: ' milliseconden| seconden| minuten| uren| dagen| weken| maanden| jaren| decennia| eeuwen| millennia',
    last: '\n',
    delim: '\n',
    empty: '',
    formatter: (value, unit) => {
      const singularLabels = ['seconde', 'minuut', 'uur', 'dag']
      const pluralLabels = ['seconden', 'minuten', 'uren', 'dagen']
      return `
        <span class="tag is-size-5 is-size-6-touch is-size-7-mobile">${value}</span>
        ${(value === 1) ? singularLabels[unit - 1] : pluralLabels[unit - 1]}
      `
    },
  })

  let lastRender = 1 // timestamp of the last render() call
  function updateCountdownHtml(now) {
    if (now - lastRender >= 1000) {
      lastRender = now
      container.innerHTML = countdown(null, end, units, 4, 0).toHTML('li')
    }
    requestAnimationFrame(updateCountdownHtml)
  }

  requestAnimationFrame(updateCountdownHtml)
}

function handleTagEvent(event) {
  if (event.target !== event.currentTarget) {
    const isActive = event.target.classList.contains('is-active')
    event.currentTarget.querySelectorAll('.tag').forEach(element => element.classList.remove('is-active'))

    if (event.target.dataset.link === 'send') {
      document.querySelector('.send').classList.remove('is-hidden')
    } else {
      document.querySelector('.send').classList.add('is-hidden')
    }

    if (isActive === false) {
      event.target.classList.add('is-active')
    }
  }
}

const carouselContainer = document.querySelector('.carousel')
const countDownContainer = document.querySelector('[data-js-countown="container"]')
const payLink = document.querySelector('[data-js="pay-link"]')

const payLinks = {
  /* HIER KUN JE DE LINKS UIT STRIPE AANPASSEN
   * De naam, bijvoorbeeld "send" of "pickup", laten staan anders gaat het stuk!
   * Tussen de haakjes '' de link invullen, bijvoorbeeld: 'https://buy.stripe.com/live_a1b2c3d4e5f6g7h8j9'
   */
  send: 'https://buy.stripe.com/4gw00wgFSdZT9O014a?locale=nl',
  pickup: 'https://buy.stripe.com/cN2bJedtGaNHd0c9AF?locale=nl',
}

if (carouselContainer) {
  attachCarousel(carouselContainer)
}

if (countDownContainer) {
  let endDataElement = document.querySelector('[data-js-countown="end-date"]').getAttribute('datetime')
  let endDate = new Date(endDataElement)

  if (endDate < new Date()) {
    document.querySelectorAll('[data-js="countdown"], [data-js="for-sale"], [data-js="sold-out"]').forEach(e => e.classList.toggle('is-hidden'))
  } else {
    attachCountdown(countDownContainer, endDate)
  }
}

if ( ! payLink.closest('[data-js="for-sale"]').classList.contains('is-hidden')) {
  document.querySelector('[data-js="tags"]').addEventListener('click', handleTagEvent)

  payLink.addEventListener('click', (event) => {
    event.preventDefault()
    // get send or pickup
    const tag = document.querySelector('[data-js="tags"] .is-active')

    if ( ! tag) {
      alert('Je moet kiezen of je de trui wilt ophalen of laten verzenden!')
    } else {
      document.location = payLinks[tag.dataset.link]
    }
  })
}
