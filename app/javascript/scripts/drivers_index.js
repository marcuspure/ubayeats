import Rails from '@rails/ujs';

document.addEventListener('turbolinks:load', () => {
  if (document.querySelector('.driver_profiles.index')){
    document.querySelector('.cart-icon').remove()
    window.initMap = async() => {
      const geocoder = new google.maps.Geocoder()
      let lat, lng, origin;
      let orders = document.querySelector('.order')
      
      const onlineBtn = document.querySelector(".online-btn")
      const offlineBtn = document.querySelector('.offline-btn')
      onlineBtn.addEventListener('click', (e) => {
        e.preventDefault()
        document.querySelector('.status h1').innerText = "等待新訂單..."

        Rails.ajax({
          url: '/drivers.json',
          type: 'get',
          success: (resp) => {
            console.log(resp);
            if (resp !== {}){
              resp.map((order) => {
                const ordercard = document.createElement('div')
                ordercard.classList.add('order', 'p-4', 'xl:w-1/4', 'md:w-1/2', 'w-full')
                ordercard.innerHTML = `
                <div class="h-full p-6 rounded-lg border-2 border-gray-300 flex flex-col relative overflow-hidden">
                  <h2 class="order-num text-sm tracking-widest title-font mb-1 font-medium">
                    ${order.num}
                  </h2>
                  <h1 class="text-3xl text-gray-900 pb-4 mb-0 leading-none">
                    ${order.store.store_name}
                  </h1>
                  <p class="store-address flex items-center text-gray-600 pb-2 border-b border-gray-200">
                    ${order.store.store_address}
                  </p>
                  <p class="distance flex items-center text-gray-600 mb-2 text-xl">
                    距離/時間
                  </p>
                  <button class="take-order-btn flex items-center mt-auto text-white bg-gray-400 border-0 py-2 px-4 w-full focus:outline-none hover:bg-red-500 rounded">
                    接單
                    <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" class="w-4 h-4 ml-auto" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
                `
                geocoder.geocode({'address': order.store.store_address}, function (results, status) {
                  if (status === 'OK') {
                    console.log(results[0].place_id);
                    const orderPlaceId = results[0].place_id
                    directionMap(ordercard, orderPlaceId)
                  }
                  else {
                    console.log('errrrrrrrrr1');
                    alert('Geocode was not successful for the following reason: ' +    status);
                  }
                });
                document.querySelector('.order-lists').appendChild(ordercard)
                ordercard.querySelector('.take-order-btn').addEventListener('click' , setTakeOrderBtn);
              })
            }
          },
          error: function(err) {
            console.log(err)
          }
        })

        Rails.ajax({
          url: '/drivers/online',
          type: 'post',
          success: (resp) => {
            console.log(resp);
          },
          error: function(err) {
            console.log(err)
          }
        })
      })  

      offlineBtn.addEventListener('click', (e) => {
        document.querySelector('.status h1').innerText = "未上線"
        
        if (order){
          order.remove()
          order = undefined
          endMarker.setMap(null)
          map.setCenter(origin)
          directionsDisplay.setMap(null);
          const steps = document.querySelector('.steps')
          if (steps){
            steps.remove()
          }
        }
        Rails.ajax({
          url: '/drivers/online',
          type: 'post',
          success: (resp) => {
            console.log(resp);
          },
          error: function(err) {
            console.log(err)
          }
        })
      })
      
      navigator.geolocation.watchPosition((position) => {
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        origin = new google.maps.LatLng(lat, lng);

        if (orders){
          const orders = document.querySelectorAll('.order')
          orders.forEach((order) => {
            const address = order.querySelector('.store-address').innerText
            geocoder.geocode({'address': address}, function (results, status) {
              if (status == 'OK') {
                const placeId = results[0].place_id
                directionMap(order, placeId)
              }
              else {
                alert('Geocode was not successful for the following reason: ' +    status);
              }
            });  
            order.querySelector('.take-order-btn').addEventListener('click', setTakeOrderBtn)
          })
        }
      })

      function setTakeOrderBtn(e){
        const num = e.target.parentNode.querySelector('.order-num').innerText
        Rails.ajax({
          url: '/orders/driver_take_order',
          type: 'post',
          data: new URLSearchParams({'order': num}),
          success: (resp) => {
            window.location.href = `/drivers/order_deliver?order=${num}`
          },
          error: function(err) {
            console.log(err)
          }
        })
      }

      function directionMap(order, placeId){
        // 計算路程時間距離
        const service = new google.maps.DistanceMatrixService();
    
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [{placeId: String(placeId)}],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: true,
            avoidTolls: true,
          },
          (response, status) => {
            if (status !== "OK") {
              console.log(status);
            } else {
              const distance = response.rows[0].elements[0].distance.text;
              const time = response.rows[0].elements[0].duration.text;
              order.querySelector('.distance').innerText = `${time}(${distance})`;
            }
          }
        )
      }
    }
  } else if (!document.querySelector('.driver_profiles.order_deliver')){
    window.initMap = () => {}
    navigator.geolocation.clearWatch(rePosition)    
  }
})