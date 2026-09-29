-- Colour used to default to off for every new shop, which hid the "Color" option
-- on the customer order form. Turn it on; owners can still disable it in Business Profile.
UPDATE shop_capabilities
SET capabilities = JSON_SET(COALESCE(capabilities, JSON_OBJECT()), '$.color', CAST('true' AS JSON));
