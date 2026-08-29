import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { Service } from '../../../types';
import { useDashboard } from '../DashboardContext';

/** MODAL: NEW APPOINTMENT CREATOR — extracted verbatim from the Landing monolith. */
export default function NewAppointmentModal() {
  const { data, handleCreateAppointment, setShowNewAppointmentModal, newCustName, setNewCustName, newCustPhone, setNewCustPhone, newSelectedService, setNewSelectedService, newSelectedStaff, setNewSelectedStaff, newSelectedTime, setNewSelectedTime } = useDashboard();
  return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-xs"
          >
            <motion.form 
              onSubmit={handleCreateAppointment}
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100"
            >
              <button 
                type="button"
                onClick={() => setShowNewAppointmentModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-base mb-1">Add Salon Booking</h3>
              <p className="text-xs text-gray-400 mb-6">Manually record a client appointment walk-in or phone call</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    placeholder="e.g. Neha Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contact Phone</label>
                  <input 
                    type="tel" 
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="e.g. +91 99000 11000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:border-[#ac0053]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Service</label>
                    <select 
                      value={newSelectedService}
                      onChange={e => setNewSelectedService(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                    >
                      {data.services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Stylist</label>
                    <select 
                      value={newSelectedStaff}
                      onChange={e => setNewSelectedStaff(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                    >
                      {data.team.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Planned Time slot</label>
                  <select 
                    value={newSelectedTime}
                    onChange={e => setNewSelectedTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white outline-none"
                  >
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewAppointmentModal(false)}
                  className="w-1/2 border border-gray-200 text-gray-500 font-bold text-xs py-3 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs py-3 rounded-xl"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.form>
          </motion.div>
  );
}
