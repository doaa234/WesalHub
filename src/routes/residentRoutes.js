import express from 'express';
import { verifyToken, requirePermission } from '../middleware/authMiddleware';
import { secureApiHandler } from '../services/securityService';
import { logSensitiveAccess } from '../utils/logger';
import * as residentController from '../controllers/residentController';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all residents
router.get(
  '/',
  requirePermission('residents', 'view'),
  secureApiHandler(async (req, res) => {
    try {
      const residents = await residentController.getAllResidents(req.query);
      res.json(residents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }, 'residents')
);

// Get resident by ID
router.get(
  '/:id',
  requirePermission('residents', 'view'),
  secureApiHandler(async (req, res) => {
    try {
      const resident = await residentController.getResidentById(req.params.id);
      
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }
      
      // Log access to sensitive resident data
      if (resident.idNumber || resident.contractDetails || resident.financialInfo) {
        logSensitiveAccess({
          userId: req.user.id,
          userRole: req.user.role,
          resource: 'residents',
          resourceId: req.params.id,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json(resident);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }, 'residents')
);

// Create new resident
router.post(
  '/',
  requirePermission('residents', 'create'),
  async (req, res) => {
    try {
      const resident = await residentController.createResident(req.body);
      res.status(201).json(resident);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update resident
router.put(
  '/:id',
  requirePermission('residents', 'edit'),
  async (req, res) => {
    try {
      const resident = await residentController.updateResident(req.params.id, req.body);
      
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }
      
      res.json(resident);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete resident
router.delete(
  '/:id',
  requirePermission('residents', 'delete'),
  async (req, res) => {
    try {
      const success = await residentController.deleteResident(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: 'Resident not found' });
      }
      
      res.json({ message: 'Resident deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Upload resident document
router.post(
  '/:id/documents',
  requirePermission('residents', 'edit', 'documents'),
  async (req, res) => {
    try {
      const document = await residentController.uploadResidentDocument(req.params.id, req.body);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get resident documents
router.get(
  '/:id/documents',
  requirePermission('residents', 'view', 'documents'),
  secureApiHandler(async (req, res) => {
    try {
      const documents = await residentController.getResidentDocuments(req.params.id);
      
      // Log access to sensitive documents
      logSensitiveAccess({
        userId: req.user.id,
        userRole: req.user.role,
        resource: 'residents',
        resourceId: req.params.id,
        resourceType: 'documents',
        timestamp: new Date().toISOString()
      });
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }, 'documents')
);

export default router;