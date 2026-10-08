const express = require('express');
const pool = require('./database');
const propertiesRouter = require('./routes/properties');

const app = express();

app.use('/api/properties', propertiesRouter);

app.get('/api/health', async (_req, res) => {
	try {
		await pool.query('SELECT 1');
		res.status(200).json({ status: 'ok', database: 'connected' });
	} catch (_error) {
		res.status(503).json({ status: 'error', database: 'disconnected' });
	}
});

if (require.main === module) {
	const port = Number(process.env.PORT) || 5000;
	app.listen(port, () => {
		console.log(`IDX backend listening on port ${port}`);
	});
}

module.exports = app;
