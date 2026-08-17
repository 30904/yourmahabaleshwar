import BookingsList from '../../components/booking/BookingsList';

export default function AdminBookings() {
  return (
    <div>
      <h2 className="text-xl font-bold">All Bookings</h2>
      <p className="mt-1 text-sm text-slate-500">Platform-wide reservation management</p>
      <div className="mt-6">
        <BookingsList mode="admin" allowStatusUpdate />
      </div>
    </div>
  );
}
