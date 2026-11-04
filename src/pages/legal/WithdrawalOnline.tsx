import { FormEvent, useState } from 'react';
import '../StaticPage.css';

export default function WithdrawalOnline() {
  const [state, setState] = useState<'idle' | 'sending' | 'confirmed' | 'pending' | 'error'>('idle');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('sending');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/withdrawal', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), email: form.get('email'), orderReference: form.get('orderReference') }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (response?.ok && payload?.confirmed) setState('confirmed');
    else if (payload?.received) setState('pending');
    else setState('error');
  };
  return <div className="static-page"><div className="container">
    <h1>Vertrag widerrufen</h1>
    <div className="legal-content">
      <p>Hier kannst du einen online geschlossenen Kaufvertrag widerrufen. Die Bestellreferenz findest du in deiner Bestellbestätigung.</p>
      <form onSubmit={submit} className="content-block">
        <label>Name<br /><input className="input" name="name" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label>E-Mail-Adresse der Bestellung<br /><input className="input" name="email" type="email" required autoComplete="email" /></label>
        <label>Bestellreferenz<br /><input className="input" name="orderReference" required pattern="cs_(test|live)_[A-Za-z0-9_]+" autoComplete="off" /></label>
        <button className="btn btn--primary" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Wird übermittelt …' : 'Widerruf bestätigen'}</button>
      </form>
      <div aria-live="polite">
        {state === 'confirmed' && <p>Dein Widerruf ist eingegangen. Die Eingangsbestätigung wurde an deine Bestell-E-Mail-Adresse gesendet.</p>}
        {state === 'pending' && <p>Dein Widerruf wurde gespeichert. Die E-Mail-Bestätigung konnte noch nicht zugestellt werden; bitte bewahre diese Seite als Nachweis auf.</p>}
        {state === 'error' && <p>Die Angaben konnten keiner Bestellung zugeordnet werden oder der Dienst ist vorübergehend nicht erreichbar. Du kannst den Widerruf weiterhin per E-Mail an info@guasha-shop.de senden.</p>}
      </div>
    </div>
  </div></div>;
}
