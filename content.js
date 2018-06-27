const $ = window.$

const pageCleanup = () => {
  $('header').remove()
  $('.sc-page-header').remove()
  $('footer').remove()
}

pageCleanup()
