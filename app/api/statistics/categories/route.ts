import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  server: process.env.AZURE_SQL_SERVER || '',
  database: process.env.AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

export async function GET(req: Request) {
  let pool = null;
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const clubId = searchParams.get('clubId');

    if (!clubId) {
      return NextResponse.json(
        { error: 'clubId is required' },
        { status: 400 }
      );
    }

    pool = await sql.connect(sqlConfig);
    
    let query = `
      SELECT 
        category,
        COUNT(*) as count
      FROM user_interactions
      WHERE club_id = @clubId
    `;

    if (startDate) {
      query += ` AND CAST(timestamp AS DATE) >= @startDate`;
    }
    if (endDate) {
      query += ` AND CAST(timestamp AS DATE) <= @endDate`;
    }

    query += ` GROUP BY category ORDER BY count DESC`;

    const request = pool.request();
    request.input('clubId', sql.NVarChar, clubId);
    if (startDate) request.input('startDate', sql.DateTime, new Date(startDate));
    if (endDate) request.input('endDate', sql.DateTime, new Date(endDate));

    const result = await request.query(query);

    return NextResponse.json({
      success: true,
      categories: result.recordset
    });
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category statistics', details: String(error) },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.close();
    }
  }
} 