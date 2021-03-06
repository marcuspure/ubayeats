import Rails from '@rails/ujs';
import { stringify } from 'postcss';

document.addEventListener('turbolinks:load', () => {
  let rePosition
  window.initMap = () => {}
  navigator.geolocation.clearWatch(rePosition)

  if (document.querySelector('.driver_profiles.index')){
    if (!navigator.geolocation){
      alert('Geolocation is not supported by your browser')
      return;
    }
  
    document.querySelector('.cart-icon').remove()
    window.initMap = async() => {
      let lat, lng, origin;
      let orders = document.querySelector('.order')

      await navigator.geolocation.watchPosition((position) => {
        
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        origin = new google.maps.LatLng(lat, lng);

        if (orders){
          const orders = document.querySelectorAll('.order')
          orders.forEach((order) => {
            const latitude = order.querySelector('.store-latitude').innerText
            const longitude = order.querySelector('.store-longitude').innerText
            directionMap(order, latitude, longitude)
            order.querySelector('.take-order-btn').addEventListener('click', setTakeOrderBtn)
          })
        }
      }, () => {
        alert('請開啟定位服務！')
        document.querySelector('.driver_profiles.index').innerHTML = ''
      })
      
      const onlineBtn = document.querySelector(".online-btn")
      const offlineBtn = document.querySelector('.offline-btn')
      onlineBtn.addEventListener('click', (e) => {
        e.preventDefault()
        onlineBtn.classList.add('bg-red-500', 'text-white')
        offlineBtn.classList.remove('bg-red-500', 'text-white')

        document.querySelector('.status h1').innerText = "等待新訂單..."

        Rails.ajax({
          url: '/drivers.json',
          type: 'get',
          success: (resp) => {
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
                    <span class="store-latitude hidden">
                      ${order.store.latitude}
                    </span>
                    <span class="store-longitude hidden">
                      ${order.store.longitude}
                    </span>            
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
                const latitude = ordercard.querySelector('.store-latitude').innerText
                const longitude = ordercard.querySelector('.store-longitude').innerText
                directionMap(ordercard, latitude, longitude)
                ordercard.querySelector('.take-order-btn').addEventListener('click', setTakeOrderBtn)
                document.querySelector('.order-lists').appendChild(ordercard)
                orders = document.querySelector('.order')
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
          },
          error: function(err) {
            console.log(err)
          }
        })
      })  

      offlineBtn.addEventListener('click', (e) => {
        e.preventDefault()
        offlineBtn.classList.add('bg-red-500', 'text-white')
        onlineBtn.classList.remove('bg-red-500', 'text-white')
        
        document.querySelector('.status h1').innerText = "未上線"
        
        if (orders){
          const orderLists = document.querySelector('.order-lists')
          orderLists.querySelectorAll('.order').forEach((order) => {
            order.remove()
          })
          orders = undefined
        }
        Rails.ajax({
          url: '/drivers/online',
          type: 'post',
          success: (resp) => {
          },
          error: function(err) {
            console.log(err)
          }
        })
      })
      
      function setTakeOrderBtn(e){
        const num = e.target.parentNode.querySelector('.order-num').innerText
        Rails.ajax({
          url: '/orders/driver_take_order',
          type: 'post',
          data: JSON.stringify({num: num}),
          success: (resp) => {
            window.location.href = `/drivers/order_deliver?order=${num}`
          },
          error: function(err) {
            console.log(err)
          }
        })
      }

      function directionMap(order, latitude, longitude){
        // 計算路程時間距離
        const service = new google.maps.DistanceMatrixService();
        const store = new google.maps.LatLng(latitude, longitude);
    
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: [store],
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
  }
})