import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action, pc, remaining, seconds } = req.query;

    try {
        let labData = await kv.get('lab_status') || {};

        if (action === 'heartbeat') {
            let command = (labData[pc] && labData[pc].command) || null;
            labData[pc] = {
                remaining: parseInt(remaining),
                last_seen: Math.floor(Date.now() / 1000), 
                command: null
            };
            await kv.set('lab_status', labData);
            return res.status(200).json({ command });
        } 
        else if (action === 'get_status') {
            return res.status(200).json(labData);
        } 
        else if (action === 'adjust_time') {
            if (!labData[pc]) labData[pc] = {};
            labData[pc].command = { type: 'adjust', seconds: parseInt(seconds) };
            await kv.set('lab_status', labData);
            return res.status(200).json({ status: 'success' });
        }
        return res.status(400).json({ error: 'Invalid action' });
    } catch (error) {
        return res.status(500).json({ error: "DB error: " + error.message });
    }
}
