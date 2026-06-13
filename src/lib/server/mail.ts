const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const from = () => process.env.MAIL_FROM ?? 'opendiary@shinzo.me';
const appUrl = () => (process.env.PUBLIC_APP_URL ?? 'https://opendiary.shinzo.me').replace(/\/$/, '');

async function send(to: string, subject: string, html: string) {
	const key = process.env.RESEND_API_KEY;
	if (!key) throw new Error('RESEND_API_KEY is not set');

	const res = await fetch(RESEND_ENDPOINT, {
		method: 'POST',
		headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
		body: JSON.stringify({ from: `opendiary <${from()}>`, to, subject, html })
	});

	if (!res.ok) {
		const detail = await res.text().catch(() => '');
		throw new Error(`resend failed (${res.status}): ${detail}`);
	}
}

export async function sendVerificationEmail(to: string, token: string) {
	const link = `${appUrl()}/verify?token=${token}`;
	await send(
		to,
		'confirm your opendiary email',
		`<div style="font-family:sans-serif;line-height:1.5">
			<p>welcome to opendiary.</p>
			<p>confirm your email to start writing:</p>
			<p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#f5c242;color:#1a1a1a;border-radius:8px;text-decoration:none;font-weight:600">confirm email</a></p>
			<p style="color:#888;font-size:13px">or paste this link: <br>${link}</p>
			<p style="color:#888;font-size:13px">the link expires in 24 hours. if you didn't sign up, ignore this email.</p>
		</div>`
	);
}
