const $map = document.getElementById('map-container');
const $mapElement = document.getElementById('map');
const $toyBtn = $map.querySelector(':scope > .control-buttons > .control-button.toilet-finder > .icon-button');
const $nowBtn = $map.querySelector(':scope > .control-buttons > .control-button.location-finder > .icon-button');
const $infoPanel = $map.querySelector(':scope > .info-panel');

const mapInstance = new kakao.maps.Map($mapElement, {
    center: new kakao.maps.LatLng(35.8655753, 128.59339),
    level: 3
});



const currentInfoWindow = new kakao.maps.InfoWindow({
    content: '<div style="width: 4rem; padding: 0.5rem 0; text-align: center;">현재 위치</div>'
});
const toiletInfoWindow = new kakao.maps.InfoWindow({
    content: '<div style="width: 4rem; padding: 0.5rem 0; text-align: center;">화장실</div>'
});

let currentLat;
let currentLon;
let currentPosition;
let currentMarker;

const nowPosition = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
           currentLat = position.coords.latitude;
           currentLon = position.coords.longitude;

           currentPosition = new kakao.maps.LatLng(currentLat, currentLon);

           if (currentMarker) currentMarker.setMap(null);
           currentMarker = new kakao.maps.Marker({
              map: mapInstance,
              position: currentPosition
           });
           currentInfoWindow.open(mapInstance, currentMarker);

           mapInstance.setCenter(currentPosition);
           mapInstance.setLevel(3);
        });
    }
};

let toiletMarkers = [];
const findToilets = () => {
  toiletMarkers.forEach(marker => marker.setMap(null));
    toiletMarkers = [];

    if (!currentMarker) {
        nowPosition();
        return;
    }
    const filterToilets = toilets.filter(data => data['C0'] !== "번호");
    for (const toilet of toilets) {
        const lat = parseFloat(toilet['C20']);
        const lon = parseFloat(toilet['C21']);

        if (isNaN(lat) || isNaN(lon)) continue;

        const position = new kakao.maps.LatLng(lat, lon);
        const marker = new kakao.maps.Marker({
           map: mapInstance,
           position: position
        });

        toiletMarkers.push(marker);
    }
};




