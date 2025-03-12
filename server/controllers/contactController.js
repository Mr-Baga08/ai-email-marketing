const Contact = require('../models/Contact');
const ContactList = require('../models/ContactList');
const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const { Readable } = require('stream');

// Initialize Google Cloud Storage
const storage = new Storage();
const contactsBucket = storage.bucket(process.env.CONTACT_UPLOADS_BUCKET);

// @desc   Upload contact list file
// @route  POST /api/contacts/upload
// @access Private
exports.uploadContactList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { name, description, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'List name is required' });
    }

    // Create a unique filename
    const filename = `${req.user.id}/${Date.now()}-${req.file.originalname}`;
    
    // Upload file to GCS
    const file = contactsBucket.file(filename);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error('GCS upload error:', err);
      return res.status(500).json({ message: 'Error uploading file' });
    });

    stream.on('finish', async () => {
      try {
        // Make the file publicly accessible
        await file.makePublic();

        // Create contact list record
        const contactList = await ContactList.create({
          user: req.user.id,
          name,
          description,
          source: 'upload',
          fileUrl: `https://storage.googleapis.com/${contactsBucket.name}/${filename}`,
          originalFilename: req.file.originalname,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : []
        });

        // Process the file to extract contacts
        processContactFile(req.file, contactList, req.user.id);

        res.status(201).json({
          message: 'File uploaded successfully. Contacts are being processed.',
          contactList
        });
      } catch (error) {
        console.error('Contact list creation error:', error);
        res.status(500).json({ message: 'Error creating contact list', error: error.message });
      }
    });

    // Write file buffer to GCS
    stream.end(req.file.buffer);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Create contact list manually
// @route  POST /api/contacts/lists
// @access Private
exports.createContactList = async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'List name is required' });
    }

    const contactList = await ContactList.create({
      user: req.user.id,
      name,
      description,
      source: 'manual',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    res.status(201).json(contactList);
  } catch (error) {
    console.error('Create contact list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get all contact lists
// @route  GET /api/contacts/lists
// @access Private
exports.getContactLists = async (req, res) => {
  try {
    const contactLists = await ContactList.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(contactLists);
  } catch (error) {
    console.error('Get contact lists error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get contact list by ID
// @route  GET /api/contacts/lists/:id
// @access Private
exports.getContactListById = async (req, res) => {
  try {
    const contactList = await ContactList.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!contactList) {
      return res.status(404).json({ message: 'Contact list not found' });
    }

    res.json(contactList);
  } catch (error) {
    console.error('Get contact list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update contact list
// @route  PUT /api/contacts/lists/:id
// @access Private
exports.updateContactList = async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    const contactList = await ContactList.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!contactList) {
      return res.status(404).json({ message: 'Contact list not found' });
    }

    if (name) contactList.name = name;
    if (description !== undefined) contactList.description = description;
    if (tags) contactList.tags = tags.split(',').map(tag => tag.trim());

    const updatedList = await contactList.save();

    res.json(updatedList);
  } catch (error) {
    console.error('Update contact list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Delete contact list
// @route  DELETE /api/contacts/lists/:id
// @access Private
exports.deleteContactList = async (req, res) => {
  try {
    const contactList = await ContactList.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!contactList) {
      return res.status(404).json({ message: 'Contact list not found' });
    }

    // If the list has a file, delete it from GCS
    if (contactList.fileUrl) {
      const filename = contactList.fileUrl.split(`${contactsBucket.name}/`)[1];
      try {
        await contactsBucket.file(filename).delete();
      } catch (err) {
        console.warn(`Could not delete file ${filename}:`, err);
      }
    }

    // Remove list from all contacts
    await Contact.updateMany(
      { user: req.user.id, lists: contactList._id },
      { $pull: { lists: contactList._id } }
    );

    await contactList.remove();

    res.json({ message: 'Contact list removed' });
  } catch (error) {
    console.error('Delete contact list error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get contacts from a list
// @route  GET /api/contacts/lists/:id/contacts
// @access Private
exports.getContactsFromList = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    // Verify list belongs to user
    const contactList = await ContactList.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!contactList) {
      return res.status(404).json({ message: 'Contact list not found' });
    }

    // Build query
    const query = { 
      user: req.user.id,
      lists: contactList._id
    };

    // Add search if provided
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Contact.countDocuments(query);

    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Add contact to list
// @route  POST /api/contacts/lists/:id/contacts
// @access Private
exports.addContactToList = async (req, res) => {
  try {
    const { email, firstName, lastName, company, position, phone, customFields } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Verify list belongs to user
    const contactList = await ContactList.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!contactList) {
      return res.status(404).json({ message: 'Contact list not found' });
    }

    // Check if contact already exists for this user
    let contact = await Contact.findOne({ user: req.user.id, email: email.toLowerCase() });

    if (contact) {
      // If contact exists, update it and add to list if not already there
      if (!contact.lists.includes(contactList._id)) {
        contact.lists.push(contactList._id);
      }

      // Update other fields if provided
      if (firstName) contact.firstName = firstName;
      if (lastName) contact.lastName = lastName;
      if (company) contact.company = company;
      if (position) contact.position = position;
      if (phone) contact.phone = phone;

      // Update custom fields
      if (customFields) {
        if (!contact.customFields) {
          contact.customFields = new Map();
        }

        Object.entries(customFields).forEach(([key, value]) => {
          contact.customFields.set(key, value);
        });
      }

      await contact.save();
    } else {
      // Create new contact
      contact = await Contact.create({
        user: req.user.id,
        lists: [contactList._id],
        email: email.toLowerCase(),
        firstName,
        lastName,
        company,
        position,
        phone,
        customFields: customFields ? new Map(Object.entries(customFields)) : undefined
      });
    }

    // Update contact count in list
    contactList.contactCount = await Contact.countDocuments({
      user: req.user.id,
      lists: contactList._id
    });
    await contactList.save();

    res.status(201).json(contact);
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Remove contact from list
// @route  DELETE /api/contacts/lists/:id/contacts/:contactId
// @access Private
exports.removeContactFromList = async (req, res) => {
  try {
    // Verify list belongs to user
    const contactList = await ContactList.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!contactList) {
      return res.status(404).json({ message: 'Contact list not found' });
    }

    // Find contact
    const contact = await Contact.findOne({
      _id: req.params.contactId,
      user: req.user.id
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Remove list from contact
    contact.lists = contact.lists.filter(
      listId => listId.toString() !== contactList._id.toString()
    );

    // If contact is not in any list, delete the contact
    if (contact.lists.length === 0) {
      await contact.remove();
    } else {
      await contact.save();
    }

    // Update contact count in list
    contactList.contactCount = await Contact.countDocuments({
      user: req.user.id,
      lists: contactList._id
    });
    await contactList.save();

    res.json({ message: 'Contact removed from list' });
  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to process contact files
async function processContactFile(file, contactList, userId) {
  try {
    const fileType = file.mimetype;
    const buffer = file.buffer;
    
    let contacts = [];

    if (fileType === 'text/csv' || fileType === 'application/csv') {
      // Process CSV
contacts = await processCSV(buffer);
} else if (fileType.includes('spreadsheetml') || fileType.includes('excel')) {
  // Process Excel
  contacts = processExcel(buffer);
} else {
  throw new Error('Unsupported file type');
}

console.log(`Processing ${contacts.length} contacts from file`);

// Process contacts in batches to avoid memory issues
const batchSize = 100;
for (let i = 0; i < contacts.length; i += batchSize) {
  const batch = contacts.slice(i, i + batchSize);
  await processBatch(batch, contactList, userId);
  
  // Update contact count periodically
  if (i % 500 === 0 || i + batchSize >= contacts.length) {
    contactList.contactCount = await Contact.countDocuments({
      user: userId,
      lists: contactList._id
    });
    await contactList.save();
  }
}

// Final update of contact count
contactList.contactCount = await Contact.countDocuments({
  user: userId,
  lists: contactList._id
});
await contactList.save();

console.log(`Finished processing contacts for list ${contactList._id}`);
} catch (error) {
  console.error('Error processing contact file:', error);
  throw error;
}
}

// Process CSV file
async function processCSV(buffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(buffer.toString());
    
    readableStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('error', (error) => reject(error))
      .on('end', () => resolve(results));
  });
}

// Process Excel file
function processExcel(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  } catch (error) {
    console.error('Excel processing error:', error);
    throw new Error('Failed to process Excel file');
  }
}

// Process a batch of contacts
async function processBatch(contacts, contactList, userId) {
  for (const contact of contacts) {
    try {
      // Normalize contact data
      const normalizedContact = normalizeContactData(contact);
      
      if (!normalizedContact.email) {
        console.warn('Skipping contact without email');
        continue;
      }
      
      // Check if contact already exists
      let existingContact = await Contact.findOne({ 
        user: userId,
        email: normalizedContact.email.toLowerCase()
      });
      
      if (existingContact) {
        // Update existing contact if needed
        if (!existingContact.lists.includes(contactList._id)) {
          existingContact.lists.push(contactList._id);
          
          // Update fields if they're empty in existing contact
          if (!existingContact.firstName && normalizedContact.firstName) {
            existingContact.firstName = normalizedContact.firstName;
          }
          if (!existingContact.lastName && normalizedContact.lastName) {
            existingContact.lastName = normalizedContact.lastName;
          }
          if (!existingContact.company && normalizedContact.company) {
            existingContact.company = normalizedContact.company;
          }
          if (!existingContact.position && normalizedContact.position) {
            existingContact.position = normalizedContact.position;
          }
          if (!existingContact.phone && normalizedContact.phone) {
            existingContact.phone = normalizedContact.phone;
          }
          
          // Add new custom fields
          if (normalizedContact.customFields) {
            if (!existingContact.customFields) {
              existingContact.customFields = new Map();
            }
            
            normalizedContact.customFields.forEach((value, key) => {
              if (!existingContact.customFields.has(key)) {
                existingContact.customFields.set(key, value);
              }
            });
          }
          
          await existingContact.save();
        }
      } else {
        // Create new contact
        await Contact.create({
          user: userId,
          lists: [contactList._id],
          email: normalizedContact.email.toLowerCase(),
          firstName: normalizedContact.firstName,
          lastName: normalizedContact.lastName,
          company: normalizedContact.company,
          position: normalizedContact.position,
          phone: normalizedContact.phone,
          customFields: normalizedContact.customFields
        });
      }
    } catch (error) {
      console.error(`Error processing contact:`, error);
      // Continue with the next contact
    }
  }
}

// Normalize contact data from different file formats
function normalizeContactData(contactData) {
  const normalized = {
    customFields: new Map()
  };
  
  // Map common field names
  const fieldMappings = {
    email: ['email', 'email_address', 'emailaddress', 'e-mail', 'mail'],
    firstName: ['first_name', 'firstname', 'first name', 'given name', 'givenname'],
    lastName: ['last_name', 'lastname', 'last name', 'surname', 'family name', 'familyname'],
    company: ['company', 'company_name', 'companyname', 'organization', 'organisation'],
    position: ['position', 'job_title', 'jobtitle', 'job title', 'title', 'role'],
    phone: ['phone', 'phone_number', 'phonenumber', 'telephone', 'mobile', 'cell']
  };
  
  // Process each field in the contact data
  Object.entries(contactData).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase().trim();
    
    // Check if this is one of our standard fields
    let matched = false;
    
    for (const [fieldName, aliases] of Object.entries(fieldMappings)) {
      if (aliases.includes(lowerKey)) {
        normalized[fieldName] = value;
        matched = true;
        break;
      }
    }
    
    // If not a standard field, add to custom fields
    if (!matched && value !== null && value !== undefined && value !== '') {
      normalized.customFields.set(key, value);
    }
  });
  
  return normalized;
}