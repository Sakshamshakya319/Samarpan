"use client"

import dynamic from "next/dynamic"

const HospitalMap = dynamic(() => import("./hospital-map"), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-muted animate-pulse rounded-xl" />
})

export function HospitalMapClient(props: any) {
  return <HospitalMap {...props} />
}
