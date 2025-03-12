import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaSave, FaPaperPlane, FaCalendarAlt, FaRobot, FaUser, FaBuilding, FaEnvelope } from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import StepIndicator from '../components/ui/StepIndicator';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ContactListSelector from '../components/campaigns/ContactListSelector';
import EmailEditor from '../components/campaigns/EmailEditor';
import PersonalizationTags from '../components/campaigns/PersonalizationTags';
import TestEmailModal from '../components/campaigns/TestEmailModal';
import AIAssistantPanel from '../components/campaigns/AIAssistantPanel';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

const NewCampaignPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Current step in the campaign creation process
  const [currentStep, setCurrentStep] = useState(1);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Contact lists
  const [contactLists, setContactLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  
  // Campaign data
  const [campaign, setCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    senderName: '',
    contactListIds: [],
    schedule: {
      scheduled: false,
      datetime: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    type: 'regular',
    personalization: {
      fields: [],
      aiEnhanced: false
    }
  });
  
  // Error messages
  const [errors, setErrors] = useState({});
  
  // AI Assistant panel state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Modal states
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  
  // Sample contact for preview
  const [sampleContact, setSampleContact] = useState(null);
  
  // Available personalization fields
  const [availableFields, setAvailableFields] = useState([
    'firstName', 'lastName', 'email', 'company', 'position'
  ]);
  
  // Load contact lists on initial render
  useEffect(() => {
    const fetchContactLists = async () => {
      try {
        const response = await api.contacts.getLists();
        setContactLists(response);
        setIsLoadingLists(false);
      } catch (error) {
        console.error('Error fetching contact lists:', error);
        showToast('Failed to load contact lists', 'error');
        setIsLoadingLists(false);
      }
    };
    
    fetchContactLists();
  }, [showToast]);
  
  // Get a sample contact when a list is selected
  useEffect(() => {
    const getSampleContact = async () => {
      if (campaign.contactListIds.length === 0) {
        setSampleContact(null);
        return;
      }
      
      try {
        const response = await api.contacts.getContactsFromList(campaign.contactListIds[0], { limit: 1 });
        if (response.contacts && response.contacts.length > 0) {
          setSampleContact(response.contacts[0]);
          
          // Extract available fields from this contact
          const fields = Object.keys(response.contacts[0])
            .filter(key => !key.startsWith('_') && key !== 'id' && key !== 'lists')
            .map(key => ({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1)
            }));
          
          setAvailableFields(fields);
        }
      } catch (error) {
        console.error('Error fetching sample contact:', error);
      }
    };
    
    getSampleContact();
  }, [campaign.contactListIds]);
  
  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!campaign.name.trim()) {
        newErrors.name = 'Campaign name is required';
      }
    } else if (currentStep === 2) {
      if (campaign.contactListIds.length === 0) {
        newErrors.contactListIds = 'Please select at least one contact list';
      }
    } else if (currentStep === 3) {
      if (!campaign.subject.trim()) {
        newErrors.subject = 'Email subject is required';
      }
      if (!campaign.content.trim()) {
        newErrors.content = 'Email content is required';
      }
      if (!campaign.senderName.trim()) {
        newErrors.senderName = 'Sender name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigation between steps
  const goToNextStep = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setCampaign(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Contact list selection handler
  const handleListSelection = (selectedLists) => {
    setCampaign(prev => ({
      ...prev,
      contactListIds: selectedLists
    }));
    
    // Clear error
    if (errors.contactListIds) {
      setErrors({
        ...errors,
        contactListIds: ''
      });
    }
  };
  
  // Email content change handler
  const handleContentChange = (content) => {
    setCampaign(prev => ({
      ...prev,
      content
    }));
    
    // Clear error
    if (errors.content) {
      setErrors({
        ...errors,
        content: ''
      });
    }
  };
  
  // Schedule toggle handler
  const handleScheduleToggle = (scheduled) => {
    setCampaign(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        scheduled
      }
    }));
  };
  
  // Schedule datetime change handler
  const handleScheduleDatetimeChange = (datetime) => {
    setCampaign(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        datetime
      }
    }));
  };
  
  // Insert personalization tag
  const insertPersonalizationTag = (tag) => {
    const editor = document.getElementById('emailContent');
    
    if (editor) {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const content = campaign.content;
      const newContent = content.substring(0, start) + `{${tag}}` + content.substring(end);
      
      setCampaign(prev => ({
        ...prev,
        content: newContent
      }));
      
      // Set cursor position after the inserted tag
      setTimeout(() => {
        editor.focus();
        editor.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
      }, 0);
    }
  };
  
  // Generate AI suggestions
  const generateAISuggestions = async (prompt) => {
    setIsGeneratingAI(true);
    try {
      // Get sample contact for personalization
      let contactData = {};
      if (sampleContact) {
        contactData = {
          firstName: sampleContact.firstName || '',
          lastName: sampleContact.lastName || '',
          email: sampleContact.email || '',
          company: sampleContact.company || '',
          position: sampleContact.position || ''
        };
      }
      
      const response = await api.campaigns.generateAIContent({
        prompt,
        contactData,
        currentContent: campaign.content,
        campaignName: campaign.name
      });
      
      setAiSuggestions(response.suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      showToast('Failed to generate AI suggestions', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  // Apply AI suggestion
  const applySuggestion = (suggestion) => {
    if (suggestion.type === 'subject') {
      setCampaign(prev => ({
        ...prev,
        subject: suggestion.content
      }));
    } else if (suggestion.type === 'content') {
      setCampaign(prev => ({
        ...prev,
        content: suggestion.content
      }));
    }
  };
  
  // Save campaign as draft
  const saveCampaignDraft = async () => {
    if (!validateStep()) {
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await api.campaigns.create({
        ...campaign,
        status: 'draft'
      });
      
      showToast('Campaign draft saved successfully', 'success');
      navigate(`/campaigns/edit/${response.id}`);
    } catch (error) {
      console.error('Error saving campaign draft:', error);
      showToast('Failed to save campaign draft', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Send test email
  const sendTestEmail = async (testEmail) => {
    setIsLoading(true);
    try {
      await api.campaigns.sendTest({
        ...campaign,
        testEmail
      });
      
      showToast('Test email sent successfully', 'success');
      setShowTestEmailModal(false);
    } catch (error) {
      console.error('Error sending test email:', error);
      showToast('Failed to send test email', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send campaign
  const sendCampaign = async () => {
    if (!validateStep()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.campaigns.create(campaign);
      
      if (campaign.schedule.scheduled) {
        showToast('Campaign scheduled successfully', 'success');
      } else {
        await api.campaigns.send(response.id);
        showToast('Campaign sent successfully', 'success');
      }
      
      navigate('/campaigns');
    } catch (error) {
      console.error('Error sending campaign:', error);
      showToast('Failed to send campaign', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Campaign Details</h2>
            <p className="text-gray-600">
              Give your campaign a name and description that will help you identify it later.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name*
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={campaign.name}
                  onChange={handleInputChange}
                  className={`block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
                  placeholder="e.g., Summer Sale Announcement"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={campaign.description || ''}
                  onChange={handleInputChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="What is this campaign about?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="regular"
                      checked={campaign.type === 'regular'}
                      onChange={handleInputChange}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Regular Campaign</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="ai-generated"
                      checked={campaign.type === 'ai-generated'}
                      onChange={handleInputChange}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">AI-Enhanced</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Select Recipients</h2>
            <p className="text-gray-600">
              Choose which contact lists will receive this campaign.
            </p>
            
            {isLoadingLists ? (
              <div className="flex items-center justify-center h-40">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-4">
                <ContactListSelector
                  contactLists={contactLists}
                  selectedLists={campaign.contactListIds}
                  onSelectionChange={handleListSelection}
                  error={errors.contactListIds}
                />
                
                {campaign.contactListIds.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Lists</h3>
                    <div className="flex flex-wrap gap-2">
                      {campaign.contactListIds.map(listId => {
                        const list = contactLists.find(list => list._id === listId);
                        return list ? (
                          <span key={listId} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                            {list.name} ({list.contactCount})
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Create Email Content</h2>
              <button
                type="button"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FaRobot className="mr-2" /> AI Suggestions
              </button>
            </div>
            
            <div className={`grid ${showAIAssistant ? 'grid-cols-3 gap-6' : 'grid-cols-1'}`}>
              <div className={`space-y-6 ${showAIAssistant ? 'col-span-2' : ''}`}>
                <div>
                  <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 mb-1">
                    Sender Name*
                  </label>
                  <input
                    id="senderName"
                    name="senderName"
                    type="text"
                    value={campaign.senderName}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border ${errors.senderName ? 'border-red-300' : 'border-gray-300'} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
                    placeholder="Your name or company name"
                  />
                  {errors.senderName && <p className="mt-1 text-sm text-red-600">{errors.senderName}</p>}
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject*
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={campaign.subject}
                    onChange={handleInputChange}
                    className={`block w-full rounded-md border ${errors.subject ? 'border-red-300' : 'border-gray-300'} px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500`}
                    placeholder="Enter a compelling subject line"
                  />
                  {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="emailContent" className="block text-sm font-medium text-gray-700">
                      Email Content*
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTestEmailModal(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      Send test email
                    </button>
                  </div>
                  
                  <div className="mb-2">
                    <PersonalizationTags 
                      availableFields={availableFields}
                      onSelect={insertPersonalizationTag}
                    />
                  </div>
                  
                  <EmailEditor
                    id="emailContent"
                    value={campaign.content}
                    onChange={handleContentChange}
                    error={errors.content}
                    placeholder="Write your email content here..."
                  />
                </div>
              </div>
              
              {showAIAssistant && (
                <div className="col-span-1">
                  <AIAssistantPanel
                    onGenerateSuggestions={generateAISuggestions}
                    suggestions={aiSuggestions}
                    isLoading={isGeneratingAI}
                    onApplySuggestion={applySuggestion}
                  />
                </div>
              )}
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Preview & Send</h2>
            <p className="text-gray-600">
              Review your campaign and choose when to send it.
            </p>
            
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="text-sm text-gray-500">Campaign Preview</div>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <div className="text-sm text-gray-500">From:</div>
                  <div>{campaign.senderName}</div>
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Subject:</div>
                  <div className="font-medium">{campaign.subject}</div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: campaign.content }} />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="text-sm text-gray-500">Send Options</div>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <input
                    id="sendNow"
                    name="sendOption"
                    type="radio"
                    checked={!campaign.schedule.scheduled}
                    onChange={() => handleScheduleToggle(false)}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="sendNow" className="ml-3 block text-sm font-medium text-gray-700">
                    Send immediately
                  </label>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="scheduleForLater"
                      name="sendOption"
                      type="radio"
                      checked={campaign.schedule.scheduled}
                      onChange={() => handleScheduleToggle(true)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="scheduleForLater" className="font-medium text-gray-700">
                      Schedule for later
                    </label>
                    
                    {campaign.schedule.scheduled && (
                      <div className="mt-3">
                        <input
                          type="datetime-local"
                          name="scheduleDatetime"
                          value={campaign.schedule.datetime}
                          onChange={(e) => handleScheduleDatetimeChange(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="text-sm text-gray-500">Campaign Summary</div>
              </div>
              <div className="p-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Campaign Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{campaign.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {campaign.type === 'ai-generated' ? 'AI-Enhanced Campaign' : 'Regular Campaign'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Recipients</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contactLists.filter(list => campaign.contactListIds.includes(list._id))
                        .map(list => list.name)
                        .join(', ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Estimated Recipients</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {contactLists.filter(list => campaign.contactListIds.includes(list._id))
                        .reduce((total, list) => total + list.contactCount, 0)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render navigation buttons based on current step
  const renderNavigationButtons = () => {
    return (
      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={goToPreviousStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaArrowLeft className="mr-2" /> Previous
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaArrowLeft className="mr-2" /> Cancel
          </button>
        )}
        
        <div className="flex space-x-3">
          {/* Save as draft button (shown on all steps) */}
          <button
            type="button"
            onClick={saveCampaignDraft}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isSaving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" /> Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save Draft
              </>
            )}
          </button>
          
          {currentStep < 4 ? (
            // Next step button (steps 1-3)
            <button
              type="button"
              onClick={goToNextStep}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next <FaArrowRight className="ml-2" />
            </button>
          ) : (
            // Send or schedule button (step 4)
            <button
              type="button"
              onClick={sendCampaign}
              disabled={isLoading || (campaign.schedule.scheduled && !campaign.schedule.datetime)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" /> Processing...
                </>
              ) : campaign.schedule.scheduled ? (
                <>
                  <FaCalendarAlt className="mr-2" /> Schedule Campaign
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" /> Send Campaign
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new email campaign to engage with your audience.
          </p>
        </div>
        
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            steps={[
              { name: 'Campaign Details', completed: currentStep > 1 },
              { name: 'Select Recipients', completed: currentStep > 2 },
              { name: 'Email Content', completed: currentStep > 3 },
              { name: 'Preview & Send', completed: false }
            ]}
            currentStep={currentStep}
          />
        </div>
        
        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-md p-6">
          {renderStepContent()}
          {renderNavigationButtons()}
        </div>
      </div>
      
      {/* Test Email Modal */}
      <TestEmailModal
        isOpen={showTestEmailModal}
        onClose={() => setShowTestEmailModal(false)}
        onSend={sendTestEmail}
        isLoading={isLoading}
      />
    </DashboardLayout>
  );
};

export default NewCampaignPage;