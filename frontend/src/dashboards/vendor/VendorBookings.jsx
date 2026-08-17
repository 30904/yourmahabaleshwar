import BookingsList from '../../components/booking/BookingsList';

export default function VendorBookings() {
  return (
    
    
    <div>
      <h2 className="text-xl font-bold">Vendor Bookings</h2>
      <p className="mt-1 text-sm text-slate-500">Bookings for your listings</p>
      <div className="mt-6">
        <BookingsList mode="vendor" allowStatusUpdate />
      </div>
    </div>
  );
}