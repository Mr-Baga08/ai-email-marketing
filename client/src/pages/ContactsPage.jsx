import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUsers, 
  FaPlus, 
  FaUserPlus, 
  FaSearch, 
  FaFilter, 
  FaUpload,
  FaPencilAlt, 
  FaTrashAlt, 
  FaEllipsisH,
  FaTimes,
  FaRegTimesCircle,
  FaCheck,
  FaListUl,
  FaUserCircle
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const ContactsPage = () => {
  // State for contact lists
  const [contactLists, setContactLists] = useState([]);
  const [filteredLists, setFilteredLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  
  // State for contacts within a list
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactPage, setContactPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalContactPages, setTotalContactPages] = useState(1);
  
  // State for forms and modals
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteListConfirm, setShowDeleteListConfirm] = useState(false);
  const [showDeleteContactConfirm, setShowDeleteContactConfirm] = useState(false);
  
  // Form data state
  const [listFormData, setListFormData] = useState({ name: '', description: '', tags: '' });
  const [contactFormData, setContactFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    position: '',
    phone: '',
    customFields: {}
  });
  
  // State for items to be deleted
  const [listToDelete, setListToDelete] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  
  // State for import
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  
  // State for errors
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  
  // Refs
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();
  
  // Fetch contact lists on mount
  useEffect(() => {
    fetchContactLists();
  }, []);
  
  // Filter contact lists when search term changes
  useEffect(() => {
    if (contactLists.length > 0) {
      filterLists();
    }
  }, [contactLists, listSearchTerm]);
  
  // Fetch contacts when selected list changes
  useEffect(() => {
    if (selectedList) {
      fetchContacts(selectedList._id, contactPage);
    } else {
      setContacts([]);
      setFilteredContacts([]);
    }
  }, [selectedList, contactPage]);
  
  // Filter contacts when search term changes
  useEffect(() => {
    if (contacts.length > 0) {
      filterContacts();
    }
  }, [contacts, contactSearchTerm]);
  
  // Fetch all contact lists
  const fetchContactLists = async () => {
    setIsLoadingLists(true);
    setError('');
    
    try {
      const response = await api.contacts.getLists();
      setContactLists(response);
      setFilteredLists(response);
      
      // Select first list if available and none selected
      if (response.length > 0 && !selectedList) {
        setSelectedList(response[0]);
      }
    } catch (err) {
      console.error('Error fetching contact lists:', err);
      setError('Failed to load contact lists. Please try again.');
    } finally {
      setIsLoadingLists(false);
    }
  };
  
  // Fetch contacts for a specific list
  const fetchContacts = async (listId, page = 1) => {
    setIsLoadingContacts(true);
    setError('');
    
    try {
      const response = await api.contacts.getContactsFromList(listId, {
        page,
        limit: 20,
        search: contactSearchTerm || undefined
      });
      
      setContacts(response.contacts);
      setFilteredContacts(response.contacts);
      setTotalContacts(response.pagination.total);
      setTotalContactPages(response.pagination.pages);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again.');
    } finally {
      setIsLoadingContacts(false);
    }
  };
  
  // Filter contact lists based on search term
  const filterLists = () => {
    if (!listSearchTerm) {
      setFilteredLists(contactLists);
      return;
    }
    
    const term = listSearchTerm.toLowerCase();
    const filtered = contactLists.filter(list => 
      list.name.toLowerCase().includes(term) || 
      (list.description && list.description.toLowerCase().includes(term))
    );
    
    setFilteredLists(filtered);
  };
  
  // Filter contacts based on search term
  const filterContacts = () => {
    if (!contactSearchTerm) {
      setFilteredContacts(contacts);
      return;
    }
    
    const term = contactSearchTerm.toLowerCase();
    const filtered = contacts.filter(contact => 
      contact.email.toLowerCase().includes(term) || 
      (contact.firstName && contact.firstName.toLowerCase().includes(term)) ||
      (contact.lastName && contact.lastName.toLowerCase().includes(term)) ||
      (contact.company && contact.company.toLowerCase().includes(term))
    );
    
    setFilteredContacts(filtered);
  };
  
  // Handle contact list selection
  const handleListSelect = (list) => {
    setSelectedList(list);
    setContactPage(1);
    setContactSearchTerm('');
  };
  
  // Handle pagination for contacts
  const handleContactPagination = (newPage) => {
    if (newPage >= 1 && newPage <= totalContactPages) {
      setContactPage(newPage);
    }
  };
  
  // Create new contact list
  const handleCreateList = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!listFormData.name) {
      setFormError('List name is required');
      return;
    }
    
    try {
      const tagsArray = listFormData.tags
        ? listFormData.tags.split(',').map(tag => tag.trim())
        : [];
        
      const newList = await api.contacts.createList({
        name: listFormData.name,
        description: listFormData.description,
        tags: tagsArray.join(',')
      });
      
      // Add new list to state
      setContactLists([...contactLists, newList]);
      
      // Select the new list
      setSelectedList(newList);
      
      // Reset form and close modal
      setListFormData({ name: '', description: '', tags: '' });
      setShowCreateListModal(false);
    } catch (err) {
      console.error('Error creating contact list:', err);
      setFormError('Failed to create contact list. Please try again.');
    }
  };
  
  // Update existing contact list
  const handleUpdateList = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!listFormData.name) {
      setFormError('List name is required');
      return;
    }
    
    try {
      const tagsArray = listFormData.tags
        ? listFormData.tags.split(',').map(tag => tag.trim())
        : [];
        
      const updatedList = await api.contacts.updateList(selectedList._id, {
        name: listFormData.name,
        description: listFormData.description,
        tags: tagsArray.join(',')
      });
      
      // Update list in state
      setContactLists(contactLists.map(list => 
        list._id === updatedList._id ? updatedList : list
      ));
      
      // Update selected list
      setSelectedList(updatedList);
      
      // Reset form and close modal
      setListFormData({ name: '', description: '', tags: '' });
      setShowEditListModal(false);
    } catch (err) {
      console.error('Error updating contact list:', err);
      setFormError('Failed to update contact list. Please try again.');
    }
  };
  
  // Delete contact list
  const handleDeleteList = async () => {
    if (!listToDelete) return;
    
    try {
      await api.contacts.deleteList(listToDelete._id);
      
      // Remove list from state
      const updatedLists = contactLists.filter(list => list._id !== listToDelete._id);
      setContactLists(updatedLists);
      
      // If the deleted list was selected, select another list or set to null
      if (selectedList && selectedList._id === listToDelete._id) {
        setSelectedList(updatedLists.length > 0 ? updatedLists[0] : null);
      }
      
      // Close confirmation dialog
      setShowDeleteListConfirm(false);
      setListToDelete(null);
    } catch (err) {
      console.error('Error deleting contact list:', err);
      setError('Failed to delete contact list. Please try again.');
    }
  };
  
  // Add contact to list
  const handleAddContact = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!contactFormData.email) {
      setFormError('Email is required');
      return;
    }
    
    if (!selectedList) {
      setFormError('No list selected');
      return;
    }
    
    try {
      const newContact = await api.contacts.addContactToList(selectedList._id, contactFormData);
      
      // Add contact to state if on first page
      if (contactPage === 1) {
        setContacts([newContact, ...contacts]);
      } else {
        // If not on first page, just refresh
        fetchContacts(selectedList._id, contactPage);
      }
      
      // Update list contact count
      const updatedList = {
        ...selectedList,
        contactCount: (selectedList.contactCount || 0) + 1
      };
      setSelectedList(updatedList);
      setContactLists(contactLists.map(list => 
        list._id === updatedList._id ? updatedList : list
      ));
      
      // Reset form and close modal
      setContactFormData({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        position: '',
        phone: '',
        customFields: {}
      });
      setShowAddContactModal(false);
    } catch (err) {
      console.error('Error adding contact:', err);
      setFormError('Failed to add contact. Please try again.');
    }
  };
  
  // Update existing contact
  const handleUpdateContact = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!contactFormData.email) {
      setFormError('Email is required');
      return;
    }
    
    if (!selectedList || !contactToDelete) {
      setFormError('Invalid selection');
      return;
    }
    
    try {
      // First delete the old contact
      await api.contacts.removeContactFromList(selectedList._id, contactToDelete._id);
      
      // Then add the updated contact
      const updatedContact = await api.contacts.addContactToList(selectedList._id, contactFormData);
      
      // Update contact in state
      setContacts(contacts.map(contact => 
        contact._id === contactToDelete._id ? updatedContact : contact
      ));
      
      // Reset form and close modal
      setContactFormData({
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        position: '',
        phone: '',
        customFields: {}
      });
      setContactToDelete(null);
      setShowEditContactModal(false);
    } catch (err) {
      console.error('Error updating contact:', err);
      setFormError('Failed to update contact. Please try again.');
    }
  };
  
  // Delete contact
  const handleDeleteContact = async () => {
    if (!contactToDelete || !selectedList) return;
    
    try {
      await api.contacts.removeContactFromList(selectedList._id, contactToDelete._id);
      
      // Remove contact from state
      setContacts(contacts.filter(contact => contact._id !== contactToDelete._id));
      
      // Update list contact count
      const updatedList = {
        ...selectedList,
        contactCount: Math.max((selectedList.contactCount || 0) - 1, 0)
      };
      setSelectedList(updatedList);
      setContactLists(contactLists.map(list => 
        list._id === updatedList._id ? updatedList : list
      ));
      
      // Close confirmation dialog
      setShowDeleteContactConfirm(false);
      setContactToDelete(null);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact. Please try again.');
    }
  };
  
  // Handle file selection for import
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setImportFile(file);
  };
  
  // Import contacts
  const handleImportContacts = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!importFile) {
      setFormError('Please select a file to import');
      return;
    }
    
    if (!selectedList) {
      setFormError('No list selected');
      return;
    }
    
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await api.contacts.uploadContacts(formData);
      
      // Show import results
      setImportResults(response);
      
      // Update list contact count
      if (response.success) {
        const updatedList = {
          ...selectedList,
          contactCount: (selectedList.contactCount || 0) + response.preview.length
        };
        setSelectedList(updatedList);
        setContactLists(contactLists.map(list => 
          list._id === updatedList._id ? updatedList : list
        ));
        
        // Refresh contacts
        fetchContacts(selectedList._id, 1);
      }
    } catch (err) {
      console.error('Error importing contacts:', err);
      setFormError('Failed to import contacts. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };
  
  // Open edit list modal
  const handleOpenEditList = () => {
    if (!selectedList) return;
    
    setListFormData({
      name: selectedList.name,
      description: selectedList.description || '',
      tags: (selectedList.tags || []).join(', ')
    });
    
    setShowEditListModal(true);
  };
  
  // Open edit contact modal
  const handleOpenEditContact = (contact) => {
    setContactToDelete(contact);
    
    // Prepare custom fields
    let customFields = {};
    if (contact.customFields) {
      // Convert Map to object
      contact.customFields.forEach((value, key) => {
        customFields[key] = value;
      });
    }
    
    setContactFormData({
      email: contact.email,
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      company: contact.company || '',
      position: contact.position || '',
      phone: contact.phone || '',
      customFields
    });
    
    setShowEditContactModal(true);
  };
  
  // Handle input change for list form
  const handleListFormChange = (e) => {
    const { name, value } = e.target;
    setListFormData({
      ...listFormData,
      [name]: value
    });
  };
  
  // Handle input change for contact form
  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    
    // Handle custom fields
    if (name.startsWith('custom_')) {
      const fieldName = name.substring(7); // Remove 'custom_' prefix
      setContactFormData({
        ...contactFormData,
        customFields: {
          ...contactFormData.customFields,
          [fieldName]: value
        }
      });
    } else {
      setContactFormData({
        ...contactFormData,
        [name]: value
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        {/* Page header */}
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          {/* Left: Title */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Contacts Management</h1>
          </div>

          {/* Right: Actions */}
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
            <button
              onClick={() => setShowCreateListModal(true)}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              <span>New List</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaRegTimesCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {isLoadingLists && !contactLists.length ? (
            <Loader text="Loading contact lists..." />
          ) : filteredLists.length === 0 ? (
            <EmptyState
              title="No contact lists found"
              description="Create your first contact list to start building your audience."
              action={{
                label: "Create Contact List",
                onClick: () => setShowCreateListModal(true)
              }}
              icon={<FaUsers className="h-12 w-12 text-indigo-400" />}
            />
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Left sidebar with contact lists */}
              <div className="w-full md:w-1/4 border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Search lists"
                      value={listSearchTerm}
                      onChange={(e) => setListSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                  {filteredLists.map((list) => (
                    <div
                      key={list._id}
                      className={`p-4 border-b border-gray-200 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedList && selectedList._id === list._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                      }`}
                      onClick={() => handleListSelect(list)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{list.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {list.contactCount || 0} contacts
                          </p>
                        </div>
                        <div className="text-gray-400">
                          <FaListUl />
                        </div>
                      </div>
                      {list.description && (
                        <p className="text-sm text-gray-600 mt-2 truncate">{list.description}</p>
                      )}
                      {list.tags && list.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap">
                          {list.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mr-1 mb-1"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right side with contacts */}
              <div className="w-full md:w-3/4">
                {selectedList ? (
                  <>
                    <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">{selectedList.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedList.contactCount || 0} contacts
                        </p>
                      </div>
                      <div className="flex mt-3 sm:mt-0">
                        <button
                          onClick={() => setShowAddContactModal(true)}
                          className="btn bg-green-600 hover:bg-green-700 text-white mr-2"
                        >
                          <FaUserPlus className="w-4 h-4 mr-1" />
                          <span>Add Contact</span>
                        </button>
                        <button
                          onClick={() => setShowImportModal(true)}
                          className="btn bg-blue-600 hover:bg-blue-700 text-white mr-2"
                        >
                          <FaUpload className="w-4 h-4 mr-1" />
                          <span>Import</span>
                        </button>
                        <div className="relative">
                          <button
                            className="btn bg-gray-200 hover:bg-gray-300 text-gray-700"
                            onClick={() => {
                              const dropdown = document.getElementById('list-actions-dropdown');
                              dropdown.classList.toggle('hidden');
                            }}
                          >
                            <FaEllipsisH className="w-4 h-4" />
                          </button>
                          <div
                            id="list-actions-dropdown"
                            className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden"
                          >
                            <button
                              onClick={handleOpenEditList}
                              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <FaPencilAlt className="inline mr-2" /> Edit List
                            </button>
                            <button
                              onClick={() => {
                                setListToDelete(selectedList);
                                setShowDeleteListConfirm(true);
                                document.getElementById('list-actions-dropdown').classList.add('hidden');
                              }}
                              className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                              <FaTrashAlt className="inline mr-2" /> Delete List
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="relative w-full sm:w-72 mb-4">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Search contacts"
                          value={contactSearchTerm}
                          onChange={(e) => setContactSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      {isLoadingContacts ? (
                        <Loader text="Loading contacts..." />
                      ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-12">
                          <FaUserCircle className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {contactSearchTerm 
                              ? "No contacts match your search criteria."
                              : "Get started by adding a new contact or importing a file."}
                          </p>
                          <div className="mt-6">
                            <button
                              onClick={() => setShowAddContactModal(true)}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <FaUserPlus className="-ml-1 mr-2 h-5 w-5" />
                              Add Contact
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Company
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Position
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {filteredContacts.map((contact) => (
                                  <tr key={contact._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                          {contact.firstName ? contact.firstName.charAt(0).toUpperCase() : 'N'}
                                          {contact.lastName ? contact.lastName.charAt(0).toUpperCase() : 'A'}
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">
                                            {contact.firstName || ''} {contact.lastName || ''}
                                          </div>
                                          {contact.phone && (
                                            <div className="text-sm text-gray-500">
                                              {contact.phone}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{contact.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{contact.company || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{contact.position || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <button
                                        onClick={() => handleOpenEditContact(contact)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                      >
                                        <FaPencilAlt />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setContactToDelete(contact);
                                          setShowDeleteContactConfirm(true);
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        <FaTrashAlt />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Pagination */}
                          {totalContactPages > 1 && (
                            <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                              <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                  onClick={() => handleContactPagination(contactPage - 1)}
                                  disabled={contactPage === 1}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Previous
                                </button>
                                <button
                                  onClick={() => handleContactPagination(contactPage + 1)}
                                  disabled={contactPage === totalContactPages}
                                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                  Next
                                </button>
                              </div>
                              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(contactPage - 1) * 20 + 1}</span> to{' '}
                                    <span className="font-medium">
                                      {Math.min(contactPage * 20, totalContacts)}
                                    </span>{' '}
                                    of <span className="font-medium">{totalContacts}</span> results
                                  </p>
                                </div>
                                <div>
                                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                      onClick={() => handleContactPagination(contactPage - 1)}
                                      disabled={contactPage === 1}
                                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                      <span className="sr-only">Previous</span>
                                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    
                                    {/* Page numbers */}
                                    {Array.from({ length: totalContactPages }, (_, i) => i + 1)
                                      .filter(pageNum => {
                                        return pageNum === 1 || 
                                               pageNum === totalContactPages || 
                                               (pageNum >= contactPage - 1 && pageNum <= contactPage + 1);
                                      })
                                      .map((pageNum, i, filteredPages) => {
                                        const showEllipsisBefore = i > 0 && filteredPages[i - 1] !== pageNum - 1;
                                        const showEllipsisAfter = i < filteredPages.length - 1 && filteredPages[i + 1] !== pageNum + 1;
                                        
                                        return (
                                          <React.Fragment key={pageNum}>
                                            {showEllipsisBefore && (
                                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                ...
                                              </span>
                                            )}
                                            
                                            <button
                                              onClick={() => handleContactPagination(pageNum)}
                                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                contactPage === pageNum
                                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                              }`}
                                            >
                                              {pageNum}
                                            </button>
                                            
                                            {showEllipsisAfter && (
                                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                                ...
                                              </span>
                                            )}
                                          </React.Fragment>
                                        );
                                      })}
                                    
                                    <button
                                      onClick={() => handleContactPagination(contactPage + 1)}
                                      disabled={contactPage === totalContactPages}
                                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                      <span className="sr-only">Next</span>
                                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </nav>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No list selected</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select a list from the sidebar or create a new one to manage contacts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Contact List Modal */}
      <Modal
        isOpen={showCreateListModal}
        onClose={() => setShowCreateListModal(false)}
        title="Create Contact List"
      >
        <form onSubmit={handleCreateList}>
          {formError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {formError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              List Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={listFormData.name}
              onChange={handleListFormChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={listFormData.description}
              onChange={handleListFormChange}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tags">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={listFormData.tags}
              onChange={handleListFormChange}
              placeholder="e.g. newsletter, leads (comma separated)"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
              onClick={() => setShowCreateListModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create List
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contact List Modal */}
      <Modal
        isOpen={showEditListModal}
        onClose={() => setShowEditListModal(false)}
        title="Edit Contact List"
      >
        <form onSubmit={handleUpdateList}>
          {formError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {formError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-name">
              List Name *
            </label>
            <input
              type="text"
              id="edit-name"
              name="name"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={listFormData.name}
              onChange={handleListFormChange}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-description">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows="3"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={listFormData.description}
              onChange={handleListFormChange}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-tags">
              Tags
            </label>
            <input
              type="text"
              id="edit-tags"
              name="tags"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={listFormData.tags}
              onChange={handleListFormChange}
              placeholder="e.g. newsletter, leads (comma separated)"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
              onClick={() => setShowEditListModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update List
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        title="Add Contact"
      >
        <form onSubmit={handleAddContact}>
          {formError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {formError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={contactFormData.email}
              onChange={handleContactFormChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.firstName}
                onChange={handleContactFormChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.lastName}
                onChange={handleContactFormChange}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="company">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={contactFormData.company}
              onChange={handleContactFormChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="position">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.position}
                onChange={handleContactFormChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.phone}
                onChange={handleContactFormChange}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
              onClick={() => setShowAddContactModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        isOpen={showEditContactModal}
        onClose={() => setShowEditContactModal(false)}
        title="Edit Contact"
      >
        <form onSubmit={handleUpdateContact}>
          {formError && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
              {formError}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-email">
              Email Address *
            </label>
            <input
              type="email"
              id="edit-email"
              name="email"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={contactFormData.email}
              onChange={handleContactFormChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-firstName">
                First Name
              </label>
              <input
                type="text"
                id="edit-firstName"
                name="firstName"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.firstName}
                onChange={handleContactFormChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-lastName">
                Last Name
              </label>
              <input
                type="text"
                id="edit-lastName"
                name="lastName"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.lastName}
                onChange={handleContactFormChange}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-company">
              Company
            </label>
            <input
              type="text"
              id="edit-company"
              name="company"
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={contactFormData.company}
              onChange={handleContactFormChange}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-position">
                Position
              </label>
              <input
                type="text"
                id="edit-position"
                name="position"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.position}
                onChange={handleContactFormChange}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="edit-phone">
                Phone
              </label>
              <input
                type="text"
                id="edit-phone"
                name="phone"
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={contactFormData.phone}
                onChange={handleContactFormChange}
              />
            </div>
          </div>
          
          {/* Custom Fields */}
          {Object.entries(contactFormData.customFields).map(([key, value]) => (
            <div className="mb-4" key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`custom_${key}`}>
                {key}
              </label>
              <input
                type="text"
                id={`custom_${key}`}
                name={`custom_${key}`}
                className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={value}
                onChange={handleContactFormChange}
              />
            </div>
          ))}
          
          <div className="flex justify-end">
            <button
              type="button"
              className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
              onClick={() => setShowEditContactModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Contacts Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => !isImporting && setShowImportModal(false)}
        title="Import Contacts"
      >
        {importResults ? (
          <div>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaCheck className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Successfully imported {importResults.preview.length} contacts.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md"
                onClick={() => {
                  setImportResults(null);
                  setImportFile(null);
                  setShowImportModal(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleImportContacts}>
            {formError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                {formError}
              </div>
            )}
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Import contacts from a CSV or Excel file. The file should contain at minimum an "Email" column.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (CSV or Excel)
              </label>
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8m-12 0v-8m32-12a4 4 0 00-4-4h-8m-12 4h-8m0 0a4 4 0 00-4 4v20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    CSV or Excel files only
                  </p>
                  {importFile && (
                    <p className="text-sm font-medium text-indigo-600 mt-2">
                      Selected: {importFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={!importFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : 'Import Contacts'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Confirmation dialog for deleting list */}
      <ConfirmDialog
        isOpen={showDeleteListConfirm}
        title="Delete Contact List"
        message={`Are you sure you want to delete the list "${listToDelete?.name}"? This will remove all contacts in this list. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteList}
        onCancel={() => {
          setShowDeleteListConfirm(false);
          setListToDelete(null);
        }}
        confirmVariant="danger"
      />

      {/* Confirmation dialog for deleting contact */}
      <ConfirmDialog
        isOpen={showDeleteContactConfirm}
        title="Delete Contact"
        message={`Are you sure you want to delete the contact "${contactToDelete?.email}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteContact}
        onCancel={() => {
          setShowDeleteContactConfirm(false);
          setContactToDelete(null);
        }}
        confirmVariant="danger"
      />
    </DashboardLayout>
  );
};

export default ContactsPage;