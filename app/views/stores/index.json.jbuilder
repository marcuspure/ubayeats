json.stores do
  json.array! @store_profiles do |store|
    json.id store.id
    json.image store.store_photo
    json.name store.store_name
    json.address store.store_address
  end
end