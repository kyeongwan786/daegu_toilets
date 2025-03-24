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
let toiletMarkers = [];
let visibleToilets = [];
let selectedMarker = null;

// nowPosition 함수 : 내 위치를 지도에 마커로 띄우고 인포윈도우 생성 그리고 화면 중앙으로 오게끔
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
    } else {
        alert('위치 정보 사용할 수 없음');
    }
};

/* 화장실 찾는 함수 화장실 json데이터 위경도 불러오고 맵에 마커로 띄우기*/
const findToilets = () => {
    toiletMarkers.forEach(marker => marker.setMap(null));
    toiletMarkers = [];

    if (!currentPosition) {
        nowPosition();
        return;
    }
    // 데이터 첫 행은 필요없기때문에 날림
    const filterToilets = toilets.filter(data => data['C0'] !== "번호");

    // 화장실 찾기를 했을때 내 위치를 기준으로 가장 가까운 화장실부터 검색해야되기때문에 가장 가까운 화장실을 찾는 변수를 정의한다. ㅇㅋ?
    let minDist = Infinity;
    let closestToilet = null;
    let closestToiletMarker = null;

    for (const toilet of toilets) {
        const lat = parseFloat(toilet['C20']);
        const lon = parseFloat(toilet['C21']);
        if (isNaN(lat) || isNaN(lon)) continue;

        const position = new kakao.maps.LatLng(lat, lon);
        const marker = new kakao.maps.Marker({
           map: mapInstance,
           position: position
        });

        // 마커에 아이디와 데이터를 할당해주는 이유는 나중에 마커를 기준으로 화장실 정보를 띄우는 등 여러 상호작용을 하기위해서 이렇게했다.
        marker.id = `marker-${toiletMarkers.length}`;
        marker.toiletData = toilet;

        kakao.maps.event.addListener(marker, 'click', function(){
           const prevSelected = $infoPanel.querySelector('.toilet-item.selected');
           if (prevSelected) prevSelected.classList.remove('selected');

           const item = $infoPanel.querySelector(`.toilet-item[data-marker-id = "${marker.id}"]`);
           if (item) {
               item.classList.add('selected');
               item.scrollIntoView({ behavior: 'smooth', block: 'center'});
           }

           toiletInfoWindow.open(mapInstance, marker);
           selectedMarker = marker;
        });

        toiletMarkers.push(marker);

        const dx = position.getLat() - currentPosition.getLat();
        const dy = position.getLng() - currentPosition.getLng();
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < minDist) {
            minDist = dist;
            closestToilet = toilet;
            closestToiletMarker = marker;
        }
    }
    if (closestToilet) {
        const closestPosition = new kakao.maps.LatLng(
            parseFloat(closestToilet['C20']),
            parseFloat(closestToilet['C21'])
        );

        mapInstance.setCenter(closestPosition);

        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(currentPosition);
        bounds.extend(closestPosition);
        mapInstance.setBounds(bounds);

        selectedMarker = closestToiletMarker;

        setTimeout(findToiletsInBounds, 200);
    }
};
// 바운더리안에 화장실이있는지 확인하는 밑에 findToiletsInBounds함수안에서 현재 위치와 화장실간의 거리를 계산해야되는데 tmap api연동 전이므로 간단한 피타고라스 정리와 걸어서 걸리는 시간을 계산하는 알고리즘으로 대체 추후 tmap api적용후 바꿀 예정
const calculateDistance = (pos1, pos2) => {
  const dx = pos1.getLat() - pos2.getLat();
  const dy = pos1.getLng() - pos2.getLng();
  return Math.sqrt(dx*dx + dy*dy);
};
const calculateWalkingTime = (distance) => {
    const distanceInKm = distance * 111;  // 좌표 거리를 km로 변환
    const walkingTimeHours = distanceInKm / 4;  // 시간당 4km 속도 가정
    return Math.round(walkingTimeHours * 60);  // 분 단위로 변환
};

//지도를 이동시키거나 확대 축소 등 바운더리가 변경됐을때의 화장실을 찾는 함수다
const findToiletsInBounds = () => {
  const bounds = mapInstance.getBounds();
  visibleToilets = []; // 지도의 바운더리내에서 보이는 화장실을 빈 배열로 초기화시켰다.
    //일단 모든 화장실 마커를 반복돌린다.
    toiletMarkers.forEach((marker) => {
        const position = marker.getPosition();
        //만약 바운더리안에 화장실이 있는지 확인하는 if문이다
        if (bounds.contain(position)) {
            // 현재 위치와의 거리계산을 해야되는데 아직 tmap api연동 전이므로 간단한 피타고라스 정리 함수 만들어서쓰자.
            const dist = calculateDistance(currentPosition, position);
            // 현재 바운더리내에 있는 화장실 배열에 화장실 정보와 마커 그리고 위치정보와 거리를 푸쉬해서 주서넣는다.
            visibleToilets.push({
               toilet: marker.toiletData,
                marker: marker,
                position: position,
                distance: dist
            });
        }
    });

    // 거리가 짧은것부터 긴것까지 정렬해야하므로 sort쓰자
    visibleToilets.sort((a, b) => a.distance - b.distance);
    // infopanel에 업데이트해야하는 함수도 작성해야함 위에서 말했듯이 지도를 이동시키거나 확대 축소 등 바운더리가 변경될때마다 맵에 찍히는 화장실 데이터가 달라지기때문에 유동적으로 실시간으로 인포패널에 업데이트할 수 있는 함수를 따로 만들어야함
    updateInfoPanel(visibleToilets)
};
//기존에 있는 인포패널에있는 화장실 데이터를 싹 지운다 다시 업데이트해야하기떄문
const updateInfoPanel = (toiletsInfo) => {
  while ($infoPanel.firstChild) {
      $infoPanel.removeChild($infoPanel.firstChild);
  }
  // 바운더리내에 화장실이없을수도있다. 그럴때엔 화장실이 없다는 html 을 집어넣어야됨
  if (toiletsInfo.length === 0) {
      const noToilets = document.createElement('div');
      noToilets.className = 'no-toilets';
      noToilets.textContent = '주변에 화장실이 없습니다.';
      $infoPanel.appendChild(noToilets);
      return;
  }

  // 주변에 화장실이 몇 개 있는지 볼 수 있는 헤더 추가
  const header = document.createElement('div');
  header.className = 'toilets-header';
  header.textContent = `주변 화장실 ${toiletsInfo.length}개 발견`;
  $infoPanel.appendChild(header);

  //화장실 리스트를 담을 컨테이너 ㄱㄱ
  const listContainer = document.createElement('div');
  listContainer.className = 'toilets-list';
  //각 화장실 정보들을 반복문 돌려서 목록에 추가
  toiletsInfo.forEach(info => {
     const item = createToiletItem(info.toilet, info.marker, info.distance);
     listContainer.appendChild(item);
  });
  $infoPanel.appendChild(listContainer);

  // 길찾기 버튼 추가하고 인포패널은 시마이치자
  const navButton = document.createElement('button');
  navButton.className = 'navigation-button';
  navButton.textContent = '길찾기';
  navButton.addEventListener('click', findRoute);
  $infoPanel.appendChild(navButton);
};

//이제 위에서 각 화장실 정보들을 반복문 돌려서 목록에 추가할때 createToiletItem이라는 함수 만들자 화장실 정보나 마커들을 추가하는 함수
const createToiletItem = (toilet, marker, distance) => {
    //지금은 tmap 연동전이라 간단한 알고리즘으로 대체
  const walkingTimeMinutes = calculateWalkingTime(distance);

  const item = document.createElement('div');
  item.className = 'toilet-item';
  //마커와 상호작용을 해야되기때문에 이전에 findToilets 함수안에서 할당했듯이 아이템에다가 marker.id라는 속성을 준다.
  item.setAttribute('data-marker-id', marker.id);

  item.addEventListener('click', () => {
      const prevSelected = $infoPanel.querySelector('.toilet-item.selected');
      if (prevSelected) prevSelected.classList.remove('selected');

      item.classList.add('selected');

      mapInstance.setCenter(marker.getPosition());
      toiletInfoWindow.open(mapInstance, marker);

      selectedMarker = marker;
    });
  if (marker === selectedMarker) {
      item.classList.add('selected');
  }
    item.innerHTML = `
    <div class="item-header">
      <h3 class="item-name">${toilet['C3'] || '공중화장실'}</h3>
      <span class="item-time">${walkingTimeMinutes}분</span>
    </div>
    <p class="item-address">${toilet['C4'] || toilet['C5'] || '주소 정보 없음'}</p>
    <div class="item-info">
      <span>남: ${parseInt(toilet['C6'] || 0) + parseInt(toilet['C8'] || 0)}칸</span>
      <span>여: ${parseInt(toilet['C12'] || 0) + parseInt(toilet['C13'] || 0)}칸</span>
      <span>${toilet['C17'] || '운영시간 정보 없음'}</span>
    </div>
  `;
    return item;
};




$nowBtn.onclick = () => nowPosition();
$toyBtn.onclick = () => findToilets();
kakao.maps.event.addListener(mapInstance, 'bounds_changed', function() {
    if (window.boundsChangedTimer) clearTimeout(window.boundsChangedTimer);
    window.boundsChangedTimer = setTimeout(findToiletsInBounds, 300);
});