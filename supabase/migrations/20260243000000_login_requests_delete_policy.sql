-- Allow delete so computer can remove the login_requests row after successful session injection and redirect.
DROP POLICY IF EXISTS login_requests_delete_policy ON login_requests;
CREATE POLICY login_requests_delete_policy ON login_requests
  FOR DELETE TO anon, authenticated
  USING (true);
