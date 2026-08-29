import { Plus, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useDashboard } from '../DashboardContext';

/** Owner dashboard tab (lazy-loaded from DashboardScreen). */
export default function StaffTab() {
  const { data, onOpenStaffManagement, handleToggleStaffStatus } = useDashboard();
  return (
              <motion.div 
                key="staff"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="space-y-6 max-w-5xl mx-auto"
              >
                <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Staff Schedule & Roles</h3>
                    <p className="text-xs text-gray-400">Sync staff availability, ratings and internal commission rules</p>
                  </div>
                  <button 
                    onClick={onOpenStaffManagement}
                    className="bg-[#ac0053] hover:bg-[#ba005b] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Sync Advanced Roster
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.team.map(member => (
                    <div key={member.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#ffd9e1]">
                            <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{member.name}</h4>
                            <span className="text-xs font-bold text-[#ac0053]">{member.role}</span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-400 font-bold mt-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              {member.rating || '5.0'} / 5.0 Rating
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleToggleStaffStatus(member.id)}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${
                            member.status === 'Available' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : member.status === 'Busy'
                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {member.status || 'Available'}
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                        {member.specialties.map((spec, i) => (
                          <span key={i} className="text-[9px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">
                            {spec}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-[11px] font-semibold text-gray-400">
                        <span>Commission rate: <strong className="text-gray-700">{member.commission || 15}%</strong></span>
                        <span>Access: <strong className="text-gray-700">{member.appAccessRole || 'No App Access'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
  );
}
