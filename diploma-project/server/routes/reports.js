const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { notifyAdminsAboutNewReport, notifyUserAboutReportResponse } = require('../utils/notificationHelper');

// Получить ВСЕ жалобы (для экспорта) - ВАЖНО: этот роут должен быть ПЕРЕД /admin
router.get('/admin/all', async (req, res) => {
  try {
    console.log('=== ALL REPORTS FOR EXPORT ===');
    
    const query = `
      SELECT 
        ur.id,
        ur.reason,
        ur.description,
        ur.screenshots,
        ur.status,
        ur.admin_notes,
        ur.admin_response,
        ur.created_at,
        ur.updated_at,
        ur.reviewed_at,
        reporter.id as reporter_id,
        reporter.nickname as reporter_nickname,
        reporter.email as reporter_email,
        reported.id as reported_user_id,
        reported.nickname as reported_nickname,
        reported.email as reported_email,
        reviewer.nickname as reviewer_nickname
      FROM user_reports ur
      JOIN users reporter ON ur.reporter_id = reporter.id
      JOIN users reported ON ur.reported_user_id = reported.id
      LEFT JOIN users reviewer ON ur.reviewed_by = reviewer.id
      ORDER BY ur.created_at DESC
    `;
    
    const result = await db.query(query);
    console.log('Found', result.rows.length, 'reports for export');
    
    res.json({
      success: true,
      reports: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при загрузке всех жалоб'
    });
  }
});

// Получить все жалобы (для админа)
router.get('/admin', async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        ur.id,
        ur.reason,
        ur.description,
        ur.screenshots,
        ur.status,
        ur.admin_notes,
        ur.admin_response,
        ur.created_at,
        ur.updated_at,
        ur.reviewed_at,
        reporter.id as reporter_id,
        reporter.nickname as reporter_nickname,
        reporter.email as reporter_email,
        reported.id as reported_user_id,
        reported.nickname as reported_nickname,
        reported.email as reported_email,
        reviewer.nickname as reviewer_nickname
      FROM user_reports ur
      JOIN users reporter ON ur.reporter_id = reporter.id
      JOIN users reported ON ur.reported_user_id = reported.id
      LEFT JOIN users reviewer ON ur.reviewed_by = reviewer.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status && status !== 'all') {
      query += ` AND ur.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (
        reporter.nickname ILIKE $${paramIndex} OR 
        reported.nickname ILIKE $${paramIndex} OR 
        ur.reason ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY ur.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Получаем общее количество
    let countQuery = `
      SELECT COUNT(*) 
      FROM user_reports ur
      JOIN users reporter ON ur.reporter_id = reporter.id
      JOIN users reported ON ur.reported_user_id = reported.id
      WHERE 1=1
    `;
    
    const countParams = [];
    let countParamIndex = 1;
    
    if (status && status !== 'all') {
      countQuery += ` AND ur.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (
        reporter.nickname ILIKE $${countParamIndex} OR 
        reported.nickname ILIKE $${countParamIndex} OR 
        ur.reason ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      reports: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении жалоб'
    });
  }
});

// Обновить статус жалобы
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes, admin_response, reviewed_by } = req.body;
    
    if (!['pending', 'reviewing', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Неверный статус'
      });
    }
    
    const result = await db.query(
      `UPDATE user_reports 
       SET status = $1, 
           admin_notes = $2, 
           admin_response = $3,
           reviewed_by = $4,
           reviewed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status, admin_notes, admin_response, reviewed_by, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Жалоба не найдена'
      });
    }
    
    const report = result.rows[0];
    
    // Если статус изменен на resolved или rejected и есть ответ администратора,
    // отправляем уведомление пользователю, который отправил жалобу
    if ((status === 'resolved' || status === 'rejected') && admin_response) {
      const io = req.app.get('io');
      await notifyUserAboutReportResponse(report.reporter_id, report.id, status, admin_response, io);
    }
    
    res.json({
      success: true,
      report: report
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении статуса жалобы'
    });
  }
});

// Удалить жалобу
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM user_reports WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Жалоба не найдена'
      });
    }
    
    res.json({
      success: true,
      message: 'Жалоба удалена'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении жалобы'
    });
  }
});

module.exports = router;
