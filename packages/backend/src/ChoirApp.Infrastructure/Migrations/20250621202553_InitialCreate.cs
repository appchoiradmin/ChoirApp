using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MasterSongs",
                columns: table => new
                {
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    artist = table.Column<string>(type: "text", nullable: true),
                    lyrics_chordpro = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterSongs", x => x.song_id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.tag_id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    google_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "SongTags",
                columns: table => new
                {
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongTags", x => new { x.song_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_SongTags_MasterSongs_song_id",
                        column: x => x.song_id,
                        principalTable: "MasterSongs",
                        principalColumn: "song_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongTags_Tags_tag_id",
                        column: x => x.tag_id,
                        principalTable: "Tags",
                        principalColumn: "tag_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Choirs",
                columns: table => new
                {
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_name = table.Column<string>(type: "text", nullable: false),
                    creation_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    admin_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Choirs", x => x.choir_id);
                    table.ForeignKey(
                        name: "FK_Choirs_Users_admin_user_id",
                        column: x => x.admin_user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChoirSongVersions",
                columns: table => new
                {
                    choir_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    master_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    edited_lyrics_chordpro = table.Column<string>(type: "text", nullable: false),
                    last_edited_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    editor_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChoirSongVersions", x => x.choir_song_id);
                    table.ForeignKey(
                        name: "FK_ChoirSongVersions_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChoirSongVersions_MasterSongs_master_song_id",
                        column: x => x.master_song_id,
                        principalTable: "MasterSongs",
                        principalColumn: "song_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChoirSongVersions_Users_editor_user_id",
                        column: x => x.editor_user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistTemplates",
                columns: table => new
                {
                    template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    creation_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistTemplates", x => x.template_id);
                    table.ForeignKey(
                        name: "FK_PlaylistTemplates_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserChoirs",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserChoirs", x => new { x.user_id, x.choir_id });
                    table.ForeignKey(
                        name: "FK_UserChoirs_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserChoirs_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Playlists",
                columns: table => new
                {
                    playlist_id = table.Column<string>(type: "text", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    creation_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_modified_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    template_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Playlists", x => x.playlist_id);
                    table.ForeignKey(
                        name: "FK_Playlists_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Playlists_PlaylistTemplates_template_id",
                        column: x => x.template_id,
                        principalTable: "PlaylistTemplates",
                        principalColumn: "template_id");
                });

            migrationBuilder.CreateTable(
                name: "PlaylistTemplateSections",
                columns: table => new
                {
                    template_section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistTemplateSections", x => x.template_section_id);
                    table.ForeignKey(
                        name: "FK_PlaylistTemplateSections_PlaylistTemplates_template_id",
                        column: x => x.template_id,
                        principalTable: "PlaylistTemplates",
                        principalColumn: "template_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistSections",
                columns: table => new
                {
                    section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    playlist_id = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistSections", x => x.section_id);
                    table.ForeignKey(
                        name: "FK_PlaylistSections_Playlists_playlist_id",
                        column: x => x.playlist_id,
                        principalTable: "Playlists",
                        principalColumn: "playlist_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistTags",
                columns: table => new
                {
                    playlist_id = table.Column<string>(type: "text", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistTags", x => new { x.playlist_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_PlaylistTags_Playlists_playlist_id",
                        column: x => x.playlist_id,
                        principalTable: "Playlists",
                        principalColumn: "playlist_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaylistTags_Tags_tag_id",
                        column: x => x.tag_id,
                        principalTable: "Tags",
                        principalColumn: "tag_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistTemplateSongs",
                columns: table => new
                {
                    template_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    template_section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_master_song = table.Column<bool>(type: "boolean", nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistTemplateSongs", x => x.template_song_id);
                    table.ForeignKey(
                        name: "FK_PlaylistTemplateSongs_PlaylistTemplateSections_template_sec~",
                        column: x => x.template_section_id,
                        principalTable: "PlaylistTemplateSections",
                        principalColumn: "template_section_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaylistSongs",
                columns: table => new
                {
                    playlist_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_master_song = table.Column<bool>(type: "boolean", nullable: false),
                    order_index = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistSongs", x => x.playlist_song_id);
                    table.ForeignKey(
                        name: "FK_PlaylistSongs_PlaylistSections_section_id",
                        column: x => x.section_id,
                        principalTable: "PlaylistSections",
                        principalColumn: "section_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Choirs_admin_user_id",
                table: "Choirs",
                column: "admin_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Choirs_choir_name",
                table: "Choirs",
                column: "choir_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChoirSongVersions_choir_id",
                table: "ChoirSongVersions",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_ChoirSongVersions_editor_user_id",
                table: "ChoirSongVersions",
                column: "editor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_ChoirSongVersions_master_song_id_choir_id",
                table: "ChoirSongVersions",
                columns: new[] { "master_song_id", "choir_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_choir_id",
                table: "Playlists",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_playlist_id",
                table: "Playlists",
                column: "playlist_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_template_id",
                table: "Playlists",
                column: "template_id");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistSections_playlist_id_order_index",
                table: "PlaylistSections",
                columns: new[] { "playlist_id", "order_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistSongs_section_id_order_index",
                table: "PlaylistSongs",
                columns: new[] { "section_id", "order_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTags_tag_id",
                table: "PlaylistTags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTemplates_choir_id_title",
                table: "PlaylistTemplates",
                columns: new[] { "choir_id", "title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTemplateSections_template_id_order_index",
                table: "PlaylistTemplateSections",
                columns: new[] { "template_id", "order_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTemplateSongs_template_section_id_order_index",
                table: "PlaylistTemplateSongs",
                columns: new[] { "template_section_id", "order_index" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SongTags_tag_id",
                table: "SongTags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_tag_name",
                table: "Tags",
                column: "tag_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserChoirs_choir_id",
                table: "UserChoirs",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_email",
                table: "Users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_google_id",
                table: "Users",
                column: "google_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChoirSongVersions");

            migrationBuilder.DropTable(
                name: "PlaylistSongs");

            migrationBuilder.DropTable(
                name: "PlaylistTags");

            migrationBuilder.DropTable(
                name: "PlaylistTemplateSongs");

            migrationBuilder.DropTable(
                name: "SongTags");

            migrationBuilder.DropTable(
                name: "UserChoirs");

            migrationBuilder.DropTable(
                name: "PlaylistSections");

            migrationBuilder.DropTable(
                name: "PlaylistTemplateSections");

            migrationBuilder.DropTable(
                name: "MasterSongs");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Playlists");

            migrationBuilder.DropTable(
                name: "PlaylistTemplates");

            migrationBuilder.DropTable(
                name: "Choirs");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
