'use strict'

lat = null
lng = null
map = undefined
marker = undefined
notificationType = undefined
vehicle = undefined

pubs = ->
  pubnub = PUBNUB.init(
    publish_key: 'demo'
    subscribe_key: 'demo')

  pubnub.subscribe
    channel: 'automaticChannel'
    message: (message, channel) ->
      console.log message
      lat = message.location.lat
      lng = message.location.lon
      notificationType = message.type
      vehicle = message.vehicle.display_name
      map.setView [lat,lng]
      marker.setLatLng L.latLng(lat, lng)
      marker.bindPopup("<p>#{notificationType}</p>" +
      "<p>Vehicle: #{vehicle}</p>")

main = ->
  L.mapbox.accessToken = '<your-token-here>'
  map = L.mapbox.map('map', '<your-map-here>')

  map.setView [lat, lng], 5
  marker = L.marker [lat, lng],
    icon: L.mapbox.marker.icon('marker-color': '#f86767')

  marker.addTo map

if navigator.geolocation
  navigator.geolocation.getCurrentPosition (position) ->
    if locationMarker?
      # return if there is a locationMarker bug
      return
    # sets default position to your position
    lat = position.coords['latitude']
    lng = position.coords['longitude']

    pubs()
    main()

  (error) ->
    console.log 'Error: ', error,
    enableHighAccuracy: true
