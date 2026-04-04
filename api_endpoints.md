# Council Hub API Specification

## Authentication & Profiles (`/api/users/`)

- `GET /api/dashboard/stats/` : Returns summary stats for the administrator dashboard.
- `POST /api/users/login/` : Standard credentials login.
- `POST /api/users/register/` : Unified Registration for Councillors and Patrons.
  Payload: `{ username, password, full_name, role, [student_class, stream, gender] }`.
- `GET /api/users/me/profile/` : Returns the logged-in user's profile information.
- `PATCH /api/users/me/profile/` : Allows users to update their display name, bio, and profile picture.
- `GET /api/users/me/roles/` : Returns the active roles array for the current user.
- `GET /api/users/all-roles/` : Returns an array of all assigned user roles (used in Hierarchy Tree).
- `GET /api/users/all-profiles/` : Returns basic profile info mapped by user ID for looking up names.
- `POST /api/users/upgrade-role/` : Updates a user's cabinet position. Payload: `{ user_id, new_role }`.
- `POST /api/users/change-password/` : Allows a user to update their password. Payload: `{ current_password, new_password }`.
- `POST /api/users/forgot-password/` : Requests a password reset. Payload: `{ username }`.
- `POST /api/users/admin-reset-password/` : Administrative password override. Payload: `{ user_id, new_password }`.
- `PATCH /api/users/<id>/profile/admin/` : Administrative profile editing (Name, Role, Class, etc.).

> [!IMPORTANT]
> **Password Management Protocol**:
>
> 1. New members are registered with a **temporary password** set by the Admin.
> 2. Members are expected to change this password immediately via the **Security** section in their profile settings.
> 3. If a user forgets their password, the `forgot-password` endpoint must trigger an **Urgent Notification** to the **Admin Absolute** and **Patron** to regenerate a new temporary password for that user.
>
> **Automatic Role Swapping**: The base level for students is `councillor`. If a leadership position (e.g., Chairperson, Speaker) is assigned to a user, the backend **must automatically** demote the current holder of that position to a regular `councillor`. Only one user can hold a leadership position at a time.
>
> **Administrative Edits**: Administrative endpoints (`admin-reset-password`, `admin/profile`) are restricted to users with `Admin Absolute` or `Patron` roles. All administrative changes must be logged in the `activity-logs`.

## Notifications (`/api/notifications/`)

- `GET /api/notifications/` : Returns the notifications for the current user. Supports `?limit=20`.
- `POST /api/notifications/` : Creates a targeted notification. Payload: `{ user_id, sender_id?, title, message, type }`.
- `PATCH /api/notifications/<id>/` : Updates a specific notification. Payload: `{ feedback?, read? }`.
- `POST /api/notifications/all/` : Broadcasts a notification to all users.
- `POST /api/notifications/mark-all-read/` : Marks all current user's notifications as read.

> [!NOTE]
> The Notification object should support a `sender_id` (UUID or string) and a `feedback` text field. Meeting requests (`type: 'meeting'`) use these to allow Patrons to respond back to the original requester.

## Activity Logs (`/api/activity-logs/`)

- `GET /api/activity-logs/` : Returns activity logs. Supports `?limit=200`.
- `POST /api/activity-logs/` : Creates a new log entry. Payload: `{ action, entity_type, entity_id }`.

## Documents (`/api/documents/`)

- `GET /api/documents/` : Returns a list of uploaded documents/minutes.
- `POST /api/documents/` : Creates a document. **Must accept `multipart/form-data`** (includes [file](file:///c:/Users/Riton/Downloads/mengo-connect-hub/src/hooks/useAuth.tsx#17-25), `title`, `description`, `category`).

## Student Voices (`/api/student-voices/`)

- `GET /api/student-voices/` : Returns all student submissions.
- `POST /api/student-voices/` : Creates a new submission. **Must accept `multipart/form-data`** (includes `title`, `category`, `description`, [file](file:///c:/Users/Riton/Downloads/mengo-connect-hub/src/hooks/useAuth.tsx#17-25)).
- `PATCH /api/student-voices/<id>/` : Updates status and comments (e.g., Approve / Reject).

## Issues (`/api/issues/`)

- `GET /api/issues/` : Returns a list of council issues.
- `POST /api/issues/` : Creates a new issue. Payload `{ title, description, priority, category... }`.

## Programmes / Calendar (`/api/programmes/`)

- `GET /api/programmes/` : Returns the list of programmes & calendar events.
- `POST /api/programmes/` : Creates a new programme.

## Requisitions (`/api/requisitions/`)

- `GET /api/requisitions/` : Returns all requisitions.
- `POST /api/requisitions/` : Submits a new financial requisition.
- `PATCH /api/requisitions/<id>/` : Updates the status (Approve / Reject).

## Rota (Duty Assignments) (`/api/rotas/`)

- `GET /api/rotas/` : Returns weekly duty rotas.
- `POST /api/rotas/` : Creates a new rota object. Payload `{ week, duties: [{day, task, assigned}] }`.
- `PATCH /api/rotas/<id>/` : Updates an existing rota.
- `DELETE /api/rotas/<id>/` : Deletes a specific rota.

## Elections (`/api/applications/` and `/api/ec-access-grants/`)

- `GET /api/applications/` : Returns all election candidate applications.
- `POST /api/applications/` : Submits a new candidate application.
- `PATCH /api/applications/<id>/` : Updates the application status.
- `POST /api/applications/auto-screen/` : Auto-filters applications based on `min_average`.
- `GET /api/ec-access-grants/` : Returns electoral commission access grants.
- `POST /api/ec-access-grants/` : Grants EC access to a specified user.
- `DELETE /api/ec-access-grants/<id>/` : Revokes EC access.

---

**Data Format Notes:**

- Most endpoints assume JSON payload requests (`application/json`).
- Endpoints receiving files (e.g., Documents, Student Voices) will receive standard `multipart/form-data`.
- By default, standard list responses should return either a raw JSON array: `[{ ... }]` OR a paginated object: `{ "results": [{ ... }] }`. The frontend is designed to handle both.
