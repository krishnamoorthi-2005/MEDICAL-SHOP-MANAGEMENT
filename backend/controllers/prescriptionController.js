import PrescriptionRequest from '../models/PrescriptionRequest.js';
import path from 'path';
import fs from 'fs';
import { createWorker } from 'tesseract.js';

/* ── OCR helper: extract text then delete image ────────── */
async function extractTextAndDeleteImage(filename) {
  const imgPath = path.join(process.cwd(), 'uploads', filename);
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(imgPath);
    await worker.terminate();
    // Delete the image after successful extraction
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    return { text: text.trim(), status: 'done' };
  } catch (ocrErr) {
    console.error('[OCR] Failed:', ocrErr.message);
    // Still delete the image even if OCR failed to save space
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    return { text: '', status: 'failed' };
  }
}

/* ── GET /api/prescriptions — Admin: list all ──────────── */
export const listPrescriptions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { patientPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await PrescriptionRequest.countDocuments(query);
    const pending = await PrescriptionRequest.countDocuments({ status: 'pending' });
    const requests = await PrescriptionRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, requests, total, pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/prescriptions/pending-count — Badge count ── */
export const getPendingCount = async (req, res) => {
  try {
    const count = await PrescriptionRequest.countDocuments({ status: { $in: ['pending', 'under_review'] } });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/prescriptions — Public: patient submits ─── */
export const createPrescription = async (req, res) => {
  try {
    const { patientName, patientPhone, patientEmail, medicines, doctorName, doctorPhone } = req.body;

    if (!patientName || !patientPhone) {
      return res.status(400).json({ success: false, message: 'Patient name and phone are required' });
    }

    const uploadedFilename = req.file ? req.file.filename : null;

    if (!uploadedFilename) {
      return res.status(400).json({ success: false, message: 'Prescription image is required' });
    }

    let parsedMedicines = medicines;
    if (typeof medicines === 'string') {
      try { parsedMedicines = JSON.parse(medicines); } catch { parsedMedicines = []; }
    }

    if (!parsedMedicines || !Array.isArray(parsedMedicines)) {
      parsedMedicines = [];
    }

    // Run OCR and delete image immediately — no image stored in DB
    const { text: extractedText, status: ocrStatus } = await extractTextAndDeleteImage(uploadedFilename);

    const request = new PrescriptionRequest({
      patientName,
      patientPhone,
      patientEmail: patientEmail || '',
      medicines: parsedMedicines,
      prescriptionImage: null,       // image is not kept
      extractedText,
      ocrStatus,
      doctorName: doctorName || '',
      doctorPhone: doctorPhone || '',
    });

    await request.save();
    res.status(201).json({ success: true, request, message: 'Prescription request submitted. Admin will review shortly.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PATCH /api/prescriptions/:id/status — Admin review ── */
export const updateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'collected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await PrescriptionRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes: adminNotes || '',
        reviewedBy: req.user?.email || 'admin',
        reviewedAt: new Date(),
        notificationSent: ['approved', 'rejected'].includes(status),
      },
      { new: true }
    );

    if (!request) return res.status(404).json({ success: false, message: 'Prescription request not found' });
    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── GET /api/prescriptions/my/:phone — Patient: their requests ── */
export const getMyPrescriptions = async (req, res) => {
  try {
    const searchParam = req.params.phone;
    // Search by either phone or email
    const requests = await PrescriptionRequest.find({
      $or: [
        { patientPhone: searchParam },
        { patientEmail: searchParam }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── DELETE /api/prescriptions/:id — Admin: delete ──────── */
export const deletePrescription = async (req, res) => {
  try {
    const pr = await PrescriptionRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Not found' });

    // Clean up image file if it somehow still exists
    if (pr.prescriptionImage) {
      const imgPath = path.join(process.cwd(), 'uploads', pr.prescriptionImage);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    await pr.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
