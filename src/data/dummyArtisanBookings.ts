import type { Booking } from "@/store/useBookingStore";

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

export const dummyArtisanBookings: Booking[] = [
  // ── Today (day 0) ──────────────────────────────────────────────
  {
    id: "dummy-artisan-1",
    title: "AC Maintenance",
    customerName: "Michael C.",
    location: "123 Maple Ave, Berlin",
    date: daysFromNow(0),
    time: "8:00 AM – 12:00 PM",
    status: "COMPLETED",
    price: 120,
    image: "/images/pro.jpg",
  },
  {
    id: "dummy-artisan-2",
    title: "House Cleaning",
    customerName: "Sarah L.",
    location: "45 Oak Street, Berlin",
    date: daysFromNow(0),
    time: "2:00 PM – 4:00 PM",
    status: "COMPLETED",
    price: 80,
    image: "/images/pro.jpg",
  },

  // ── Tomorrow (day 1) ───────────────────────────────────────────
  {
    id: "dummy-artisan-3",
    title: "Plumbing Repair",
    customerName: "James K.",
    location: "78 Pine Road, Berlin",
    date: daysFromNow(1),
    time: "9:00 AM – 11:00 AM",
    status: "CONFIRMED",
    price: 200,
    image: "/images/pro.jpg",
  },
  {
    id: "dummy-artisan-4",
    title: "Electrical Wiring",
    customerName: "Anna M.",
    location: "10 Birch Lane, Berlin",
    date: daysFromNow(1),
    time: "3:00 PM – 5:00 PM",
    status: "PENDING",
    price: 250,
    image: "/images/pro.jpg",
  },

  // ── Day +2 ─────────────────────────────────────────────────────
  {
    id: "dummy-artisan-5",
    title: "Furniture Assembly",
    customerName: "Tom B.",
    location: "55 Cedar Blvd, Berlin",
    date: daysFromNow(2),
    time: "10:00 AM – 12:00 PM",
    status: "CONFIRMED",
    price: 60,
    image: "/images/pro.jpg",
  },

  // ── Day +3 ─────────────────────────────────────────────────────
  {
    id: "dummy-artisan-6",
    title: "Garden Cleanup",
    customerName: "Lisa R.",
    location: "22 Elm Street, Berlin",
    date: daysFromNow(3),
    time: "8:00 AM – 10:00 AM",
    status: "PENDING",
    price: 90,
    image: "/images/pro.jpg",
  },
  {
    id: "dummy-artisan-7",
    title: "Painting",
    customerName: "Oliver N.",
    location: "300 Walnut Road, Berlin",
    date: daysFromNow(3),
    time: "1:00 PM – 5:00 PM",
    status: "CONFIRMED",
    price: 180,
    image: "/images/pro.jpg",
  },

  // ── Day +4 ─────────────────────────────────────────────────────
  {
    id: "dummy-artisan-8",
    title: "Deep Cleaning",
    customerName: "Emma S.",
    location: "7 Spruce Ave, Berlin",
    date: daysFromNow(4),
    time: "9:00 AM – 1:00 PM",
    status: "CONFIRMED",
    price: 140,
    image: "/images/pro.jpg",
  },

  // ── Day +5 ─────────────────────────────────────────────────────
  {
    id: "dummy-artisan-9",
    title: "HVAC Inspection",
    customerName: "David P.",
    location: "15 Chestnut Way, Berlin",
    date: daysFromNow(5),
    time: "11:00 AM – 1:00 PM",
    status: "PENDING",
    price: 110,
    image: "/images/pro.jpg",
  },

  // ── Day +6 ─────────────────────────────────────────────────────
  {
    id: "dummy-artisan-10",
    title: "Tile Fixing",
    customerName: "Mia W.",
    location: "88 Rosewood Lane, Berlin",
    date: daysFromNow(6),
    time: "2:00 PM – 4:00 PM",
    status: "CONFIRMED",
    price: 160,
    image: "/images/pro.jpg",
  },

  // ── Past / Completed ───────────────────────────────────────────
  {
    id: "dummy-artisan-11",
    title: "Window Cleaning",
    customerName: "Noah G.",
    location: "40 Poplar Drive, Berlin",
    date: daysFromNow(-1),
    time: "10:00 AM – 11:00 AM",
    status: "COMPLETED",
    price: 50,
    image: "/images/pro.jpg",
  },
  {
    id: "dummy-artisan-12",
    title: "Carpet Shampooing",
    customerName: "Chloe F.",
    location: "12 Willow Close, Berlin",
    date: daysFromNow(-2),
    time: "9:00 AM – 12:00 PM",
    status: "COMPLETED",
    price: 130,
    image: "/images/pro.jpg",
  },
];
