import { connectToDatabase } from "../lib/mongodb"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

async function inspectEvents() {
  try {
    const { db } = await connectToDatabase()
    const events = await db
      .collection("events")
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    console.log("Inspecting 5 most recent events:")
    events.forEach((event: any) => {
      console.log({
        _id: event._id,
        name: event.name,
        allowRegistrations: event.allowRegistrations,
        createdAt: event.createdAt,
      })
    })
  } catch (error) {
    console.error("Error inspecting events:", error)
  } finally {
    // The connection is cached, so we don't need to close it here.
    // If you were creating a new client each time, you would close it.
  }
}

inspectEvents()