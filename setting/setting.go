package setting

import (
	"r3/db"
	"r3/types"

	"github.com/jackc/pgx/v4"
)

func Get(loginId int64) (types.Settings, error) {
	var s types.Settings

	err := db.Pool.QueryRow(db.Ctx, `
		SELECT language_code, date_format, sunday_first_dow, font_size, borders_all,
			borders_corner, page_limit, header_captions, spacing, dark, compact,
			hint_update_version, mobile_scroll_form, warn_unsaved
		FROM instance.login_setting
		WHERE login_id = $1
	`, loginId).Scan(&s.LanguageCode, &s.DateFormat, &s.SundayFirstDow,
		&s.FontSize, &s.BordersAll, &s.BordersCorner, &s.PageLimit,
		&s.HeaderCaptions, &s.Spacing, &s.Dark, &s.Compact,
		&s.HintUpdateVersion, &s.MobileScrollForm, &s.WarnUnsaved)

	return s, err
}

func Set_tx(tx pgx.Tx, loginId int64, languageCode string, dateFormat string,
	sundayFirstDow bool, fontSize int, bordersAll bool, bordersCorner string,
	pageLimit int, headerCaptions bool, spacing int, dark bool, compact bool,
	hintUpdateVersion int, mobileScrollForm bool, warnUnsaved bool) error {

	_, err := tx.Exec(db.Ctx, `
		UPDATE instance.login_setting
		SET language_code = $1, date_format = $2, sunday_first_dow = $3,
			font_size = $4, borders_all = $5, borders_corner = $6,
			page_limit = $7, header_captions = $8, spacing = $9, dark = $10,
			compact = $11, hint_update_version = $12,
			mobile_scroll_form = $13, warn_unsaved = $14
		WHERE login_id = $15
	`, languageCode, dateFormat, sundayFirstDow, fontSize, bordersAll,
		bordersCorner, pageLimit, headerCaptions, spacing, dark, compact,
		hintUpdateVersion, mobileScrollForm, warnUnsaved, loginId)

	return err
}

func SetDefaults_tx(tx pgx.Tx, id int64, languageCode string) error {
	_, err := tx.Exec(db.Ctx, `
		INSERT INTO instance.login_setting (login_id, language_code, date_format,
			sunday_first_dow, font_size, borders_all, borders_corner, page_limit, 
			header_captions, spacing, dark, compact, hint_update_version,
			mobile_scroll_form, warn_unsaved)
		VALUES ($1,$2,'Y-m-d',true,100,false,'keep',2000,true,3,false,true,0,true,true)
	`, id, languageCode)
	return err
}

func SetLanguageCode_tx(tx pgx.Tx, id int64, languageCode string) error {
	_, err := tx.Exec(db.Ctx, `
		UPDATE instance.login_setting
		SET language_code = $1
		WHERE login_id = $2
	`, languageCode, id)
	return err
}
