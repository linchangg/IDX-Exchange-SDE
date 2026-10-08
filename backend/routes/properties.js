const express = require('express');
const pool = require('../database');

const router = express.Router();
const allowedParameters = new Set([
	'city', 'zipcode', 'minPrice', 'maxPrice', 'beds', 'baths', 'limit', 'offset'
]);

function parseInteger(value, name, { min = 0, max = 2147483647 } = {}) {
	if (typeof value !== 'string' || !/^\d+$/.test(value)) {
		throw new Error(`${name} must be a whole number between ${min} and ${max}`);
	}
	const number = Number(value);
	if (!Number.isSafeInteger(number) || number < min || number > max) {
		throw new Error(`${name} must be a whole number between ${min} and ${max}`);
	}
	return number;
}

function parseText(value, name, maxLength) {
	if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > maxLength) {
		throw new Error(`${name} must be a non-empty string of at most ${maxLength} characters`);
	}
	return value.trim();
}

router.get('/', async (req, res) => {
	let limit;
	let offset;
	let filters;
	try {
		for (const name of Object.keys(req.query)) {
			if (!allowedParameters.has(name)) throw new Error(`Unknown query parameter: ${name}`);
		}

		limit = req.query.limit === undefined ? 20 : parseInteger(req.query.limit, 'limit', { min: 1, max: 100 });
		offset = req.query.offset === undefined ? 0 : parseInteger(req.query.offset, 'offset');
		filters = [];

		if (req.query.city !== undefined) {
			filters.push(['L_City = ?', parseText(req.query.city, 'city', 50)]);
		}
		if (req.query.zipcode !== undefined) {
			filters.push(['L_Zip = ?', parseText(req.query.zipcode, 'zipcode', 20)]);
		}
		if (req.query.minPrice !== undefined) {
			filters.push(['L_SystemPrice >= ?', parseInteger(req.query.minPrice, 'minPrice')]);
		}
		if (req.query.maxPrice !== undefined) {
			filters.push(['L_SystemPrice <= ?', parseInteger(req.query.maxPrice, 'maxPrice')]);
		}
		if (req.query.beds !== undefined) {
			filters.push(['L_Keyword2 >= ?', parseInteger(req.query.beds, 'beds')]);
		}
		if (req.query.baths !== undefined) {
			if (typeof req.query.baths !== 'string' || !/^\d+(?:\.\d)?$/.test(req.query.baths)) {
				throw new Error('baths must be a non-negative number with at most one decimal place');
			}
			const baths = Number(req.query.baths);
			if (baths > 999.9) throw new Error('baths must be between 0 and 999.9');
			filters.push(['LM_Dec_3 >= ?', baths]);
		}

		const minPrice = req.query.minPrice === undefined ? undefined : Number(req.query.minPrice);
		const maxPrice = req.query.maxPrice === undefined ? undefined : Number(req.query.maxPrice);
		if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
			throw new Error('minPrice must be less than or equal to maxPrice');
		}
	} catch (error) {
		return res.status(400).json({ error: error.message });
	}

	const where = filters.length ? ` WHERE ${filters.map(([clause]) => clause).join(' AND ')}` : '';
	const filterValues = filters.map(([, value]) => value);

	try {
		const [countRows, resultRows] = await Promise.all([
			pool.query(`SELECT COUNT(*) AS total FROM rets_property${where}`, filterValues),
			pool.query(`SELECT * FROM rets_property${where} ORDER BY id LIMIT ? OFFSET ?`, [...filterValues, limit, offset])
		]);
		const total = countRows[0][0].total;
		const results = resultRows[0];
		res.status(200).json({ total, limit, offset, results });
	} catch (_error) {
		res.status(500).json({ error: 'Unable to fetch properties' });
	}
});

module.exports = router;