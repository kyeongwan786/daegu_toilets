const $map = document.getElementById('map-container');
const $mapElement = document.getElementById('map');


const mapInstance = new kakao.maps.Map($mapElement, {
    center: new kakao.maps.LatLng(35.8655753, 128.59339),
    level: 3
});