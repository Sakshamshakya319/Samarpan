import { ObjectId } from "mongodb"

export interface Hospital {
  _id?: ObjectId | string
  hospitalId: string
  hospitalName: string
  state: string
  district: string
  city: string
  address: string
  pincode: string
  latitude: number
  longitude: number
  hospitalType?: string
  ownership?: string
  speciality?: string
  phoneNumber?: string
  email?: string
  website?: string
  
  // GeoJSON Point for MongoDB $geoNear
  location: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  
  createdAt?: Date
  updatedAt?: Date
}

export interface HospitalSnapshot {
  hospitalId: string
  name: string
  address: string
  city: string
  district: string
  latitude: number
  longitude: number
  osmUrl: string
  googleUrl: string
}
