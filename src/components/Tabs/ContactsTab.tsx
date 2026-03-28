import React from "react";
import { Plus, Contact as ContactIcon } from "lucide-react";
import { Contact } from "../../../types";

interface ContactsTabProps {
  contacts: Contact[];
  handleCSVImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * ContactsTab Component
 * 
 * Displays a list of contacts and provides an interface for importing contacts via CSV.
 * 
 * @param {ContactsTabProps} props - Component props
 * @returns {JSX.Element} The rendered contacts tab
 * 
 * @example
 * <ContactsTab contacts={contacts} handleCSVImport={onImport} />
 */
const ContactsTab: React.FC<ContactsTabProps> = ({ contacts, handleCSVImport }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
          <ContactIcon size={20} className="text-indigo-500" /> Contacts
        </h3>
        <label className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2">
          <Plus size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Import CSV</span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
        </label>
      </div>

      <div className="grid gap-4">
        {contacts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-3xl border border-white/5">
            <p className="text-slate-500 text-sm font-bold">No contacts yet. Import a CSV to get started.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold">{contact.name}</h4>
                <p className="text-slate-500 text-xs">{contact.email}</p>
                {contact.hauler && <p className="text-indigo-400 text-[10px] uppercase font-black mt-1">{contact.hauler}</p>}
              </div>
              <div className="text-right text-[10px] text-slate-600 uppercase font-bold">
                {new Date(contact.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(ContactsTab);
