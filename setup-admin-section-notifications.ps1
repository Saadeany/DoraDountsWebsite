$ErrorActionPreference = 'Stop'

$root = Get-Location

function Replace-Exact($Path, $Old, $New, $Label) {
    $full = Join-Path $root $Path
    if (-not (Test-Path $full)) { throw "Missing file: $Path" }
    $text = (Get-Content $full -Raw) -replace "`r`n", "`n"
    if (-not $text.Contains($Old)) { throw "Could not find expected code in $Path for $Label. No changes made to this file." }
    $text = $text.Replace($Old, $New)
    [System.IO.File]::WriteAllText($full, $text, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "Updated $Path - $Label" -ForegroundColor Green
}

# 1) Frontend notification polling: 60s -> 15s.
$contextPath = Join-Path $root 'frontend/src/context/NotificationContext.jsx'
$contextText = (Get-Content $contextPath -Raw) -replace "`r`n", "`n"
$contextOld = @'
  // Initial load + poll every 60s for new notifications
  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 60000);
'@
$contextNew = @'
  // Initial load + poll every 15s for new notifications
  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 15000);
'@
if (-not $contextText.Contains($contextOld)) { throw 'Could not find expected polling code in frontend/src/context/NotificationContext.jsx' }
$contextText = $contextText.Replace($contextOld, $contextNew)
[System.IO.File]::WriteAllText($contextPath, $contextText, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Updated frontend/src/context/NotificationContext.jsx - notification polling' -ForegroundColor Green

# 2) Admin sidebar: show independent dots and mark only that section read.
$adminOld = @'
const AdminLayout = () => {
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();
  const location    = useLocation();
  const navigate    = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/admin/login"); };
'@
$adminNew = @'
const AdminLayout = () => {
  const { logout, user } = useAuth();
  const { notifications, read } = useNotifications();
  const location    = useLocation();
  const navigate    = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/admin/login"); };

  const sectionForNotification = (notification) => {
    if (notification.meta?.return_request_id) return "returns";
    if (notification.meta?.email_log_id) return "email-logs";
    if (notification.type === "admin_new_order") return "orders";
    if (notification.type === "admin_new_user") return "customers";
    return null;
  };

  const hasUnread = (section) =>
    notifications.some(
      (notification) =>
        !notification.is_read && sectionForNotification(notification) === section
    );

  const handleNavClick = (to, onClose) => {
    const section =
      to === "/admin/orders" ? "orders" :
      to === "/admin/returns" ? "returns" :
      to === "/admin/customers" ? "customers" :
      to === "/admin/email-logs" ? "email-logs" :
      null;

    if (section) {
      const unread = notifications.filter(
        (notification) =>
          !notification.is_read && sectionForNotification(notification) === section
      );
      Promise.allSettled(unread.map((notification) => read(notification.id)));
    }
    onClose();
  };
'@
Replace-Exact 'frontend/src/pages/admin/AdminLayout.jsx' $adminOld $adminNew 'section notification state'

$navOld = @'
              <Icon size={16} className="shrink-0" />
              {label}
'@
$navNew = @'
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {hasUnread(
                label === "Orders" ? "orders" :
                label === "Returns" ? "returns" :
                label === "Customers" ? "customers" :
                label === "Email Logs" ? "email-logs" :
                ""
              ) && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(255,255,255,0.08)]"
                  aria-label={`New ${label.toLowerCase()} notification`}
                  title={`New ${label.toLowerCase()} notification`}
                />
              )}
'@
Replace-Exact 'frontend/src/pages/admin/AdminLayout.jsx' $navOld $navNew 'sidebar red dots'

$clickOld = '            <Link key={to} to={to} onClick={onClose}'
$clickNew = '            <Link key={to} to={to} onClick={() => handleNavClick(to, onClose)}'
Replace-Exact 'frontend/src/pages/admin/AdminLayout.jsx' $clickOld $clickNew 'section click handling'

# 3) Backend: every new EmailLog gets an admin notification tagged with its log id.
$emailOld = @'
const nodemailer = require("nodemailer");
const { EmailLog } = require("../models");
'@
$emailNew = @'
const nodemailer = require("nodemailer");
const { EmailLog, User } = require("../models");
const { createNotification } = require("./notificationService");
'@
Replace-Exact 'backend/utils/emailService.js' $emailOld $emailNew 'email-log notification imports'

$logOld = @'
  // Fire-and-forget log write — don't await in the caller
  EmailLog.create({
    user_id: userId || null,
    email_type: emailType,
    recipient: to,
    subject,
    status,
    error_message: errorMessage,
    sent_at: new Date(),
  }).catch(() => {}); // never throw from log writer

  return status === "sent";
'@
$logNew = @'
  // Create the email log and a matching admin notification.
  // The notification is tagged with email_log_id so the Email Logs sidebar dot
  // is independent from Orders, Returns, and Customers.
  try {
    const log = await EmailLog.create({
      user_id: userId || null,
      email_type: emailType,
      recipient: to,
      subject,
      status,
      error_message: errorMessage,
      sent_at: new Date(),
    });

    const admin = await User.findOne({ where: { role: "admin" } });
    if (admin) {
      await createNotification({
        user_id: admin.id,
        title: "New Email Log",
        message: `${emailType.replace(/_/g, " ")} email ${status === "sent" ? "was sent" : "failed"} to ${to}.`,
        type: "admin_contact",
        meta: { email_log_id: log.id, email_type: emailType, status },
      });
    }
  } catch (err) {
    console.error("[Email] Failed to create email log/notification:", err.message);
  }

  return status === "sent";
'@
Replace-Exact 'backend/utils/emailService.js' $logOld $logNew 'email-log notification creation'

Write-Host "`nDone. Review the changes with:" -ForegroundColor Cyan
Write-Host "git diff -- frontend/src/pages/admin/AdminLayout.jsx frontend/src/context/NotificationContext.jsx backend/utils/emailService.js" -ForegroundColor Yellow
Write-Host "Then run: npm run build (from frontend), or rebuild Docker." -ForegroundColor Cyan
