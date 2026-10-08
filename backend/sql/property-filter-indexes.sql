SET SESSION sql_mode = 'ONLY_FULL_GROUP_BY,NO_ENGINE_SUBSTITUTION';

CREATE INDEX idx_rets_property_price ON rets_property (L_SystemPrice);
CREATE INDEX idx_rets_property_beds ON rets_property (L_Keyword2);
CREATE INDEX idx_rets_property_baths ON rets_property (LM_Dec_3);
