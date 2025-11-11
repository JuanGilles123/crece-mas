-- ============================================
-- AGREGAR CAMPO EMAIL A PROFILES
-- Necesario para que los miembros del equipo puedan heredar VIP
-- ============================================

-- 1️⃣ Verificar si la columna email existe en profiles
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        -- Agregar la columna email
        ALTER TABLE profiles ADD COLUMN email TEXT;
        
        -- Crear índice para búsquedas rápidas
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
        
        RAISE NOTICE 'Columna email agregada a profiles';
    ELSE
        RAISE NOTICE 'Columna email ya existe en profiles';
    END IF;
END $$;

-- 2️⃣ Sincronizar emails desde auth.users a profiles
-- (Solo funciona si tienes acceso a auth.users, puede fallar)
UPDATE profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;

-- 3️⃣ Crear trigger para mantener email sincronizado
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Intentar obtener el email del usuario
    NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS on_profile_email_sync ON profiles;

-- Crear trigger para INSERT
CREATE TRIGGER on_profile_email_sync
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    WHEN (NEW.email IS NULL)
    EXECUTE FUNCTION sync_profile_email();

-- 4️⃣ Verificar que los emails se cargaron
SELECT 
    id,
    full_name,
    email,
    CASE 
        WHEN email IS NULL THEN '❌ Sin email'
        ELSE '✅ Con email'
    END as status
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
