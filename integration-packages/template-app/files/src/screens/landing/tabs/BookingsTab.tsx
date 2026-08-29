import { Plus, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import BookingManagementPanel from '../../../components/BookingManagementPanel';
import { useDashboard } from '../DashboardContext';

/** Owner dashboard tab (lazy-loaded from DashboardScreen). */
export default function BookingsTab() {
  const { data, currentThemeId, appointments, setShowNewAppointmentModal, bookingActor, bookingTenantId, bookingToast, setBookingToast } = useDashboard();
  return (
              <motion.div 
                key="bookings"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 max-w-5xl mx-auto"
              >
                {/* PHASE 16.7 — real website bookings for THIS salon only
                    (session-resolved actor; data layer re-checks access). */}
                <BookingManagementPanel
                  actor={bookingActor}
                  businessId={bookingTenantId}
                  themeId={currentThemeId}
                  onShowToast={(msg) => { setBookingToast(msg); }}
                />
                {bookingToast && (
                  <div
                    data-testid="booking-management-toast"
                    className="bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    {bookingToast}
                  </div>
                )}

                <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">On-Call Client Planner</h3>
                    <p className="text-xs text-gray-400">Total active booking pipelines for this session</p>
                  </div>
                  <button 
                    onClick={() => setShowNewAppointmentModal(true)}
                    className="bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Schedule New
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Timeline Schedule</h4>
                    <div className="space-y-3">
                      {appointments.map(appt => (
                        <div key={appt.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-gray-50/20">
                          <div className="w-20 shrink-0 text-center border-r border-gray-100 pr-4">
                            <p className="text-xs font-bold text-gray-800">{appt.time}</p>
                            <span className="text-[10px] text-gray-400 font-semibold">Today</span>
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="text-xs font-bold text-gray-900">{appt.customerName}</h5>
                                <p className="text-[10px] text-gray-400 font-medium">Phone: {appt.phone}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase ${
                                appt.status === 'Confirmed' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : appt.status === 'Completed' 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'bg-amber-50 text-amber-700'
                              }`}>
                                {appt.status}
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100/60 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                              <div>
                                Treatment: <span className="text-gray-800 font-bold">{appt.serviceName}</span>
                              </div>
                              <div>
                                Stylist: <span className="text-[#ac0053] font-bold">{appt.staffName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-4 bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Status Ledgers</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold text-emerald-800">Confirmed</span>
                        <span className="text-lg font-extrabold text-emerald-950">
                          {appointments.filter(a => a.status === 'Confirmed').length}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-800">Pending Setup</span>
                        <span className="text-lg font-extrabold text-amber-950">
                          {appointments.filter(a => a.status === 'Pending').length}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-600">Total Requests</span>
                        <span className="text-lg font-extrabold text-gray-900">
                          {appointments.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
  );
}
