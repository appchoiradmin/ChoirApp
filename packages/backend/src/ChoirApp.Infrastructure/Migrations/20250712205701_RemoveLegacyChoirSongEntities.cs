using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyChoirSongEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Playlists_Choirs_choir_id",
                table: "Playlists");

            migrationBuilder.DropForeignKey(
                name: "FK_Playlists_PlaylistTemplates_playlist_template_id",
                table: "Playlists");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistSongs_ChoirSongVersions_choir_song_id",
                table: "PlaylistSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistTemplateSongs_ChoirSongVersions_choir_song_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropTable(
                name: "ChoirSongVersions");

            migrationBuilder.DropIndex(
                name: "IX_Playlists_playlist_template_id",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "creation_date",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "is_public",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "playlist_template_id",
                table: "Playlists");

            migrationBuilder.RenameColumn(
                name: "choir_song_id",
                table: "PlaylistTemplateSongs",
                newName: "song_version_id");

            migrationBuilder.RenameIndex(
                name: "IX_PlaylistTemplateSongs_choir_song_id",
                table: "PlaylistTemplateSongs",
                newName: "IX_PlaylistTemplateSongs_song_version_id");

            migrationBuilder.RenameColumn(
                name: "choir_song_id",
                table: "PlaylistSongs",
                newName: "song_version_id");

            migrationBuilder.RenameIndex(
                name: "IX_PlaylistSongs_choir_song_id",
                table: "PlaylistSongs",
                newName: "IX_PlaylistSongs_song_version_id");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "Playlists",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "date",
                table: "Playlists",
                newName: "created_at");

            migrationBuilder.AlterColumn<Guid>(
                name: "choir_id",
                table: "Playlists",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "creator_id",
                table: "Playlists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "Playlists",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "visibility",
                table: "Playlists",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "created_at",
                table: "MasterSongs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<Guid>(
                name: "creator_id",
                table: "MasterSongs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "visibility",
                table: "MasterSongs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "SongVersions",
                columns: table => new
                {
                    version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    master_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    artist = table.Column<string>(type: "text", nullable: true),
                    lyrics_chordpro = table.Column<string>(type: "text", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    parent_version_id = table.Column<Guid>(type: "uuid", nullable: true),
                    visibility = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongVersions", x => x.version_id);
                    table.ForeignKey(
                        name: "FK_SongVersions_MasterSongs_master_song_id",
                        column: x => x.master_song_id,
                        principalTable: "MasterSongs",
                        principalColumn: "song_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SongVersions_SongVersions_parent_version_id",
                        column: x => x.parent_version_id,
                        principalTable: "SongVersions",
                        principalColumn: "version_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SongVersions_Users_creator_id",
                        column: x => x.creator_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SongVisibilities",
                columns: table => new
                {
                    song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    visibility_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongVisibilities", x => new { x.song_id, x.choir_id });
                    table.ForeignKey(
                        name: "FK_SongVisibilities_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongVisibilities_MasterSongs_song_id",
                        column: x => x.song_id,
                        principalTable: "MasterSongs",
                        principalColumn: "song_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VersionTags",
                columns: table => new
                {
                    version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_id = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId1 = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VersionTags", x => new { x.version_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_VersionTags_SongVersions_version_id",
                        column: x => x.version_id,
                        principalTable: "SongVersions",
                        principalColumn: "version_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VersionTags_Tags_TagId1",
                        column: x => x.TagId1,
                        principalTable: "Tags",
                        principalColumn: "tag_id");
                    table.ForeignKey(
                        name: "FK_VersionTags_Tags_tag_id",
                        column: x => x.tag_id,
                        principalTable: "Tags",
                        principalColumn: "tag_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VersionVisibilities",
                columns: table => new
                {
                    version_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    visibility_id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChoirId1 = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VersionVisibilities", x => new { x.version_id, x.choir_id });
                    table.ForeignKey(
                        name: "FK_VersionVisibilities_Choirs_ChoirId1",
                        column: x => x.ChoirId1,
                        principalTable: "Choirs",
                        principalColumn: "choir_id");
                    table.ForeignKey(
                        name: "FK_VersionVisibilities_Choirs_choir_id",
                        column: x => x.choir_id,
                        principalTable: "Choirs",
                        principalColumn: "choir_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VersionVisibilities_SongVersions_version_id",
                        column: x => x.version_id,
                        principalTable: "SongVersions",
                        principalColumn: "version_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_creator_id",
                table: "Playlists",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "IX_MasterSongs_creator_id",
                table: "MasterSongs",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_creator_id",
                table: "SongVersions",
                column: "creator_id");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_master_song_id_title",
                table: "SongVersions",
                columns: new[] { "master_song_id", "title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_parent_version_id",
                table: "SongVersions",
                column: "parent_version_id");

            migrationBuilder.CreateIndex(
                name: "IX_SongVisibilities_choir_id",
                table: "SongVisibilities",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_VersionTags_tag_id",
                table: "VersionTags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "IX_VersionTags_TagId1",
                table: "VersionTags",
                column: "TagId1");

            migrationBuilder.CreateIndex(
                name: "IX_VersionVisibilities_choir_id",
                table: "VersionVisibilities",
                column: "choir_id");

            migrationBuilder.CreateIndex(
                name: "IX_VersionVisibilities_ChoirId1",
                table: "VersionVisibilities",
                column: "ChoirId1");

            migrationBuilder.AddForeignKey(
                name: "FK_MasterSongs_Users_creator_id",
                table: "MasterSongs",
                column: "creator_id",
                principalTable: "Users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Playlists_Choirs_choir_id",
                table: "Playlists",
                column: "choir_id",
                principalTable: "Choirs",
                principalColumn: "choir_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Playlists_Users_creator_id",
                table: "Playlists",
                column: "creator_id",
                principalTable: "Users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistSongs_SongVersions_song_version_id",
                table: "PlaylistSongs",
                column: "song_version_id",
                principalTable: "SongVersions",
                principalColumn: "version_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistTemplateSongs_SongVersions_song_version_id",
                table: "PlaylistTemplateSongs",
                column: "song_version_id",
                principalTable: "SongVersions",
                principalColumn: "version_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MasterSongs_Users_creator_id",
                table: "MasterSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_Playlists_Choirs_choir_id",
                table: "Playlists");

            migrationBuilder.DropForeignKey(
                name: "FK_Playlists_Users_creator_id",
                table: "Playlists");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistSongs_SongVersions_song_version_id",
                table: "PlaylistSongs");

            migrationBuilder.DropForeignKey(
                name: "FK_PlaylistTemplateSongs_SongVersions_song_version_id",
                table: "PlaylistTemplateSongs");

            migrationBuilder.DropTable(
                name: "SongVisibilities");

            migrationBuilder.DropTable(
                name: "VersionTags");

            migrationBuilder.DropTable(
                name: "VersionVisibilities");

            migrationBuilder.DropTable(
                name: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_Playlists_creator_id",
                table: "Playlists");

            migrationBuilder.DropIndex(
                name: "IX_MasterSongs_creator_id",
                table: "MasterSongs");

            migrationBuilder.DropColumn(
                name: "creator_id",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "name",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "visibility",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "created_at",
                table: "MasterSongs");

            migrationBuilder.DropColumn(
                name: "creator_id",
                table: "MasterSongs");

            migrationBuilder.DropColumn(
                name: "visibility",
                table: "MasterSongs");

            migrationBuilder.RenameColumn(
                name: "song_version_id",
                table: "PlaylistTemplateSongs",
                newName: "choir_song_id");

            migrationBuilder.RenameIndex(
                name: "IX_PlaylistTemplateSongs_song_version_id",
                table: "PlaylistTemplateSongs",
                newName: "IX_PlaylistTemplateSongs_choir_song_id");

            migrationBuilder.RenameColumn(
                name: "song_version_id",
                table: "PlaylistSongs",
                newName: "choir_song_id");

            migrationBuilder.RenameIndex(
                name: "IX_PlaylistSongs_song_version_id",
                table: "PlaylistSongs",
                newName: "IX_PlaylistSongs_choir_song_id");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Playlists",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Playlists",
                newName: "date");

            migrationBuilder.AlterColumn<Guid>(
                name: "choir_id",
                table: "Playlists",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "creation_date",
                table: "Playlists",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<bool>(
                name: "is_public",
                table: "Playlists",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "playlist_template_id",
                table: "Playlists",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChoirSongVersions",
                columns: table => new
                {
                    choir_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    choir_id = table.Column<Guid>(type: "uuid", nullable: false),
                    editor_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    master_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    edited_lyrics_chordpro = table.Column<string>(type: "text", nullable: false),
                    last_edited_date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Playlists_playlist_template_id",
                table: "Playlists",
                column: "playlist_template_id");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Playlists_Choirs_choir_id",
                table: "Playlists",
                column: "choir_id",
                principalTable: "Choirs",
                principalColumn: "choir_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Playlists_PlaylistTemplates_playlist_template_id",
                table: "Playlists",
                column: "playlist_template_id",
                principalTable: "PlaylistTemplates",
                principalColumn: "template_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistSongs_ChoirSongVersions_choir_song_id",
                table: "PlaylistSongs",
                column: "choir_song_id",
                principalTable: "ChoirSongVersions",
                principalColumn: "choir_song_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlaylistTemplateSongs_ChoirSongVersions_choir_song_id",
                table: "PlaylistTemplateSongs",
                column: "choir_song_id",
                principalTable: "ChoirSongVersions",
                principalColumn: "choir_song_id");
        }
    }
}
