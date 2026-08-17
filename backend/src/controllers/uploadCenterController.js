import { UPLOAD_TYPES, buildTemplateBuffer, parseExcelBuffer } from '../utils/uploadCenterTemplates.js';
import { importBulkData, listUploadTypes } from '../services/uploadCenterService.js';
import { error } from '../utils/apiResponse.js';

export const getUploadTypes = async (req, res) => {
  return res.json({ success: true, data: listUploadTypes() });
};

export const downloadTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    if (!UPLOAD_TYPES[type]) return error(res, 'Invalid template type', 400);

    const config = UPLOAD_TYPES[type];
    const buffer = buildTemplateBuffer(type);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-template.xlsx"`);
    return res.send(buffer);
  } catch (e) {
    return error(res, e.message || 'Template generation failed', 500);
  }
};

export const importUpload = async (req, res) => {
  try {
    const { type } = req.params;
    if (!UPLOAD_TYPES[type]) return error(res, 'Invalid import type', 400);
    if (!req.file) return error(res, 'Excel file is required (.xlsx, .xls)', 400);

    const rows = parseExcelBuffer(req.file.buffer);
    if (!rows.length) return error(res, 'No data rows found in file. Fill the template below the header row.', 400);

    const result = await importBulkData(type, rows, req.user._id);

    return res.json({
      success: true,
      message: `Imported ${result.created} of ${result.total} rows`,
      data: result,
    });
  } catch (e) {
    return error(res, e.message || 'Import failed', 500);
  }
};
