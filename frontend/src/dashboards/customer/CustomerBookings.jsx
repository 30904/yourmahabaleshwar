import BookingsList from '../../components/booking/BookingsList';

export default function CustomerBookings() {
  return (
    <div>
      <h2 className="text-xl font-bold">My Bookings</h2>
      <p className="mt-1 text-sm text-slate-500">Track and manage your reservations</p>
      <div className="mt-6">
        <BookingsList mode="customer" />
      </div>
    </div>
  );
}
