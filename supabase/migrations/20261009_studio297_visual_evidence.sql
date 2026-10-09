-- Hexfield Studio 297: retain compact rendered-image measurements beside
-- each visitor's private human feedback, so visual learning survives devices.
-- All previously submitted votes remain valid because the column is nullable.
-- Table RLS continues to enforce visitor_id = auth.uid(). No publicly readable
-- visual fingerprints and no service-role credentials in browser code.
ALTER TABLE public.hexfield_studio_votes
  ADD COLUMN IF NOT EXISTS visual_signature jsonb;
DO $guard$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conname = 'studio297_visual_signature_shape'
      AND conrelid = 'public.hexfield_studio_votes'::regclass) THEN
  ALTER TABLE public.hexfield_studio_votes
    ADD CONSTRAINT studio297_visual_signature_shape CHECK (
    visual_signature IS NULL OR
    (jsonb_typeof(visual_signature)='object' AND visual_signature->>'v'='1'
      AND CASE WHEN jsonb_typeof(visual_signature->'l')='array'
        THEN jsonb_array_length(visual_signature->'l')=40 ELSE false END
      AND CASE WHEN jsonb_typeof(visual_signature->'c')='array'
        THEN jsonb_array_length(visual_signature->'c')=72 ELSE false END
      AND CASE WHEN jsonb_typeof(visual_signature->'e')='array'
        THEN jsonb_array_length(visual_signature->'e')=40 ELSE false END
      AND CASE WHEN jsonb_typeof(visual_signature->'h')='array'
        THEN jsonb_array_length(visual_signature->'h')=8 ELSE false END
      AND pg_column_size(visual_signature)<=8192)
    );
 END IF;
END;
$guard$;
