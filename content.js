/* global chrome, kdTree, localStorage */
/* eslint-disable new-cap */

const $ = window.$
const jsonUrl = 'https://vasi.siminn.is/smsbeta/static/geojson.json'

let _tree = null
let _route = null
let _locations = null

const pageCleanup = () => {
  $('header').remove()
  $('.sc-page-header').remove()
  $('footer').remove()

  $('iframe').after('<div id="right-sidebar" class="sidenav"></div>')
}

const getRoute = () => {
  // Get route from localStorage - is this unnecessary?
  let route = localStorage.getItem('route')

  if (route !== null) {
    _route = JSON.parse(route)
  } else {
    // Get route from extension path if not in localStorage
    const path = chrome.runtime.getURL('route.json')
    $.get(path, function (data) {
      _route = data
    })
    localStorage.setItem('route', JSON.stringify(route))
  }
}

const getLocations = () => {
  $.get(jsonUrl, function (data) {
    let items = []
    items.push(data.features)
    _locations = items[0]
  })
}

const removeDropouts = () => {
  // This is a shitmix to remove "dropouts"
  const dropouts = ['NCC', 'TIBCO SVB', 'Cintamani']
  dropouts.forEach(dropout => {
    let index = _locations.findIndex(x => x.properties.name === dropout)
    if (index > -1) {
      _locations.splice(index, 1)
    }
  })
}

var distance = (a, b) => {
  // Could use haversine, but fuck it (https://en.wikipedia.org/wiki/Haversine_formula)
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
}

const findNearest = (tree, lat, lon) => {
  // https://github.com/ubilabs/kd-tree-javascript
  const nearest = tree.nearest({ Lat: lat, Lon: lon }, 1)
  return nearest
}

const addNearest = (tree, items) => {
  items.forEach((item, i) => {
    const nearest = findNearest(tree, item.geometry.coordinates[1], item.geometry.coordinates[0])
    const next = nearest[0][0]
    item.nearest = next
    // console.log(`This -> Lat: ${x.geometry.coordinates[1]}, Lon: ${x.geometry.coordinates[0]}`)
    // console.log(`Next -> Distance: ${next.Distance}, Lat: ${next.Lat}, Lon: ${next.Lon}`)
    // console.log(`${item.properties.name}: ${nearest[0][0].Distance}`)
  })
}

const filterGroup = (filter) => {
  return _locations.filter((item) => {
    return item.properties.hopur === filter
  })
}

const sortDist = (a, b) => {
  if (parseFloat(a.nearest.Distance) > parseFloat(b.nearest.Distance)) return -1
  if (parseFloat(a.nearest.Distance) < parseFloat(b.nearest.Distance)) return 1
  return 0
}

const display = () => {
  const solo = filterGroup('Solo').sort(sortDist)
  const agroup = filterGroup('A Flokkur').sort(sortDist)
  const bgroup = filterGroup('B Flokkur').sort(sortDist)
  // $('#right-sidebar').css('width', '250px')

  $('#right-sidebar').empty()
  $('#right-sidebar').append('<div class="title">Sóló</div>')
  solo.forEach((item, i) => {
    $('#right-sidebar').append(`<div>${i + 1}: ${item.properties.name} - ${parseFloat(item.nearest.Distance).toFixed(1)} km</div>`)
  })
  $('#right-sidebar').append('<div class="title">4 manna lið</div>')
  agroup.forEach((item, i) => {
    $('#right-sidebar').append(`<div>${i + 1}: ${item.properties.name} - ${parseFloat(item.nearest.Distance).toFixed(1)} km</div>`)
  })
  $('#right-sidebar').append('<div class="title">10 manna lið</div>')
  bgroup.forEach((item, i) => {
    $('#right-sidebar').append(`<div>${i + 1}: ${item.properties.name} - ${parseFloat(item.nearest.Distance).toFixed(1)} km</div>`)
  })
}

const update = () => {
  getLocations()
  removeDropouts()
  addNearest(_tree, _locations)
  display()
}

pageCleanup()
getRoute()
getLocations()

// Wait for route and locations
$(document).ajaxStop(function () {
  _tree = new kdTree(_route, distance, ['Lat', 'Lon'])
  removeDropouts()
  addNearest(_tree, _locations)
  display()
})

setInterval(update, 60000)
