import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Filter, 
  Search, 
  Plus, 
  Trash2, 
  FileSpreadsheet 
} from 'lucide-react';

/**
 * ContactListSelector component for selecting and managing contact lists
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.availableLists - List of available contact lists
 * @param {function} props.onListsSelected - Callback when lists are selected
 * @param {function} [props.onCreateList] - Optional callback to create a new list
 * @param {function} [props.onDeleteList] - Optional callback to delete a list
 */
const ContactListSelector = ({
  availableLists = [],
  onListsSelected,
  onCreateList,
  onDeleteList
}) => {
  // State management
  const [selectedLists, setSelectedLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriteria, setFilterCriteria] = useState({
    minContacts: 0,
    maxContacts: Infinity
  });

  // Filter and search lists
  const filteredLists = availableLists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContactCount = 
      list.contactCount >= filterCriteria.minContacts && 
      list.contactCount <= filterCriteria.maxContacts;
    
    return matchesSearch && matchesContactCount;
  });

  // Toggle list selection
  const toggleListSelection = (listId) => {
    setSelectedLists(prev => 
      prev.includes(listId)
        ? prev.filter(id => id !== listId)
        : [...prev, listId]
    );
  };

  // Notify parent component when selections change
  useEffect(() => {
    onListsSelected(selectedLists);
  }, [selectedLists, onListsSelected]);

  // Render list item
  const renderListItem = (list) => {
    const isSelected = selectedLists.includes(list.id);
    
    return (
      <div 
        key={list.id}
        className={`
          flex items-center justify-between 
          p-3 rounded-lg 
          cursor-pointer 
          transition-all 
          ${isSelected 
            ? 'bg-blue-100 dark:bg-blue-900 border-blue-300' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
          border
          ${isSelected 
            ? 'border-blue-300' 
            : 'border-transparent'}
        `}
        onClick={() => toggleListSelection(list.id)}
      >
        <div className="flex items-center space-x-3">
          <div className={`
            p-2 rounded-full 
            ${isSelected 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-600'}
          `}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">
              {list.name}
            </p>
            <p className="text-sm text-gray-500">
              {list.contactCount} contacts
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onDeleteList && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteList(list.id);
              }}
              className="text-red-500 hover:bg-red-50 p-1 rounded-full"
              title="Delete List"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Select Contact Lists
        </h3>
      </div>

      {/* Search and Filter Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2 mb-3">
          <div className="relative flex-grow">
            <input 
              type="text"
              placeholder="Search lists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {onCreateList && (
            <button
              onClick={onCreateList}
              className="
                bg-blue-500 
                text-white 
                px-3 
                py-2 
                rounded-lg 
                flex 
                items-center 
                space-x-2 
                hover:bg-blue-600 
                transition-colors
              "
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">New List</span>
            </button>
          )}
        </div>

        {/* Filter Inputs */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              Min Contacts
            </label>
            <input 
              type="number"
              value={filterCriteria.minContacts}
              onChange={(e) => setFilterCriteria(prev => ({
                ...prev, 
                minContacts: Number(e.target.value)
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              Max Contacts
            </label>
            <input 
              type="number"
              value={filterCriteria.maxContacts === Infinity 
                ? '' 
                : filterCriteria.maxContacts}
              onChange={(e) => setFilterCriteria(prev => ({
                ...prev, 
                maxContacts: e.target.value 
                  ? Number(e.target.value) 
                  : Infinity
              }))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Lists Container */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLists.length > 0 ? (
          filteredLists.map(renderListItem)
        ) : (
          <div className="text-center py-6 text-gray-500">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No contact lists found</p>
            {searchTerm && (
              <p className="text-sm">Try clearing your search</p>
            )}
          </div>
        )}
      </div>

      {/* Selected Lists Summary */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {selectedLists.length} lists selected
        </p>
        <p className="text-sm text-gray-500">
          Total contacts: {
            selectedLists.reduce((total, listId) => {
              const list = availableLists.find(l => l.id === listId);
              return total + (list?.contactCount || 0);
            }, 0)
          }
        </p>
      </div>
    </div>
  );
};

export default ContactListSelector;