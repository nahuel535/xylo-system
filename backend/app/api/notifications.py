from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.client import Client, ClientReminder
from app.utils.email import is_configured, send_email, NOTIFY_EMAIL

router = APIRouter(prefix="/notifications", tags=["Notificaciones"])

REMINDER_LABELS = {
    "followup_1week": "Seguimiento 1 semana",
    "promo_3months":  "Promo amigos 3 meses",
    "custom":         "Recordatorio",
}


@router.get("/status")
def notification_status():
    return {
        "email_configured": is_configured(),
        "notify_email": NOTIFY_EMAIL if NOTIFY_EMAIL else None,
    }


@router.post("/send-digest")
def send_digest(db: Session = Depends(get_db)):
    today = date.today()
    rows = (
        db.query(ClientReminder, Client)
        .join(Client, ClientReminder.client_id == Client.id)
        .filter(
            ClientReminder.status == "pending",
            ClientReminder.due_date <= today + timedelta(days=7),
        )
        .order_by(ClientReminder.due_date.asc())
        .all()
    )

    if not rows:
        return {"message": "No hay seguimientos en los próximos 7 días.", "sent": False, "count": 0}

    html = _build_digest_html(rows, today)
    sent = send_email(
        subject=f"📋 Seguimientos CRM — {today.strftime('%d/%m/%Y')}",
        html_body=html,
    )

    return {
        "message": "Email enviado correctamente" if sent else "Email no configurado (revisá las variables de entorno)",
        "sent": sent,
        "count": len(rows),
    }


def _build_digest_html(rows, today: date) -> str:
    overdue  = [(r, c) for r, c in rows if r.due_date < today]
    due_today = [(r, c) for r, c in rows if r.due_date == today]
    upcoming  = [(r, c) for r, c in rows if r.due_date > today]

    dias_es = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"]
    meses_es = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"]
    fecha_hoy = f"{dias_es[today.weekday()]} {today.day} de {meses_es[today.month - 1]} de {today.year}"

    def reminder_row(r, c, accent):
        tipo = REMINDER_LABELS.get(r.type, r.type)
        fecha = r.due_date.strftime("%d/%m/%Y")
        phone_html = f'<br><span style="color:#64748b">📞 {c.phone}</span>' if c.phone else ""
        ig_html = f'<br><span style="color:#64748b">📸 @{c.instagram}</span>' if c.instagram else ""
        note_html = f'<br><em style="color:#94a3b8; font-size:13px">{r.note}</em>' if r.note else ""
        return f"""
        <div style="border-left:4px solid {accent};padding:12px 16px;margin:8px 0;background:#f8fafc;border-radius:0 8px 8px 0">
          <strong style="color:#0f172a;font-size:15px">{c.name}</strong>
          <span style="color:{accent};font-size:12px;font-weight:600;margin-left:8px">{tipo}</span><br>
          <span style="color:#64748b;font-size:12px">📅 {fecha}{phone_html}{ig_html}</span>
          {note_html}
        </div>"""

    sections = ""
    if overdue:
        sections += f'<h3 style="color:#dc2626;margin:20px 0 8px">🔴 Vencidos ({len(overdue)})</h3>'
        for r, c in overdue:
            sections += reminder_row(r, c, "#dc2626")
    if due_today:
        sections += f'<h3 style="color:#d97706;margin:20px 0 8px">🟡 Para hoy ({len(due_today)})</h3>'
        for r, c in due_today:
            sections += reminder_row(r, c, "#d97706")
    if upcoming:
        sections += f'<h3 style="color:#2563eb;margin:20px 0 8px">🔵 Esta semana ({len(upcoming)})</h3>'
        for r, c in upcoming:
            sections += reminder_row(r, c, "#2563eb")

    return f"""<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:24px">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:28px 32px">
    <h1 style="margin:0;color:white;font-size:22px;font-weight:700">📋 Seguimientos CRM</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px">Xylo · {fecha_hoy.capitalize()}</p>
  </div>
  <div style="padding:24px 32px">
    {sections}
  </div>
  <div style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">Xylo Sistema interno · Notificaciones automáticas CRM</p>
  </div>
</div>
</body></html>"""
