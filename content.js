/* global chrome, kdTree, localStorage */
/* eslint-disable new-cap */

const $ = window.$
const jsonUrl = 'https://vasi.siminn.is/smsbeta/static/geojson.json'

const pageCleanup = () => {
  $('header').remove()
  $('.sc-page-header').remove()
  $('footer').remove()
}

const getRoute = () => {
  let route = localStorage.getItem('route')

  if (route === null) {
    const path = chrome.runtime.getURL('route.json')
    $.ajax({url: path, type: 'get', dataType: 'json', async: false, success: function (data) { route = data }})
    localStorage.setItem('route', JSON.stringify(route))
  }
  return route
}

const getLocations = () => {
  let solo = []
  let agroup = []
  let bgroup = []
  let hjolakraftur = []

  $.ajax({
    url: jsonUrl,
    type: 'get',
    dataType: 'json',
    async: false,
    success: function (data) {
      const items = data.features
      items.forEach(item => {
        switch (item.properties.hopur) {
          case 'Solo':
            solo.push(item)
            break
          case 'A Flokkur':
            agroup.push(item)
            break
          case 'B Flokkur':
            bgroup.push(item)
            break
          case 'Hjolakraftur':
            hjolakraftur.push(item)
            break
          default:
            console.warn('Ungrouped', item)
        }
      })
    }
  })

  console.log('solo', solo)
  console.log('agroup', agroup)
  console.log('bgroup', bgroup)
  console.log('hjolakraftur', hjolakraftur)

  return {'solo': solo, 'agroup': agroup, 'bgroup': bgroup, 'hjolakraftur': hjolakraftur}
}

var distance = (a, b) => {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
}

const findNearest = (tree, lat, lon) => {
  const nearest = tree.nearest({ Lat: lat, Lon: lon }, 1)
  console.log('nearest', nearest)
  return nearest
}

// setInterval(getGeoJson, 60000)

pageCleanup()
const route = getRoute()
const tree = new kdTree(route, distance, ['Lat', 'Lon'])
const locations = getLocations()

locations.solo.forEach(x => {
  console.log(x.geometry)
  const nearest = findNearest(tree, x.geometry.coordinates[0], x.geometry.coordinates[1])
})
