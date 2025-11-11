-- ============================================
-- FUNCIÓN PARA OBTENER EMAIL DEL OWNER
-- Necesaria para heredar VIP a miembros del equipo
-- ============================================

-- Crear función que obtiene el email de un usuario por su ID
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Necesario para acceder a auth.users
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obtener email desde auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;

-- Probar la función con tu usuario (reemplaza el UUID con tu user_id)
-- SELECT get_user_email('tu-user-id-aqui');

-- ============================================
-- ALTERNATIVA: Función para obtener owner email de una organización
-- ============================================

CREATE OR REPLACE FUNCTION get_organization_owner_email(org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  owner_email TEXT;
BEGIN
  -- Obtener el email del owner de la organización
  SELECT u.email INTO owner_email
  FROM organizations o
  JOIN auth.users u ON u.id = o.owner_id
  WHERE o.id = org_id;
  
  RETURN owner_email;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION get_organization_owner_email(UUID) TO authenticated;

-- Probar la función
-- SELECT 
--   id,
--   name,
--   get_organization_owner_email(id) as owner_email
-- FROM organizations
-- LIMIT 5;
