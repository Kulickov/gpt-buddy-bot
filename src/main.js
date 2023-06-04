import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import config from "config";
import { ogg } from "./ogg.js";
import { openai } from "./openai.js";
import { removeFile } from "./utils.js";

const INITIAL_SESSION = {
    messages: [],
};

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

bot.command("new", async (ctx) => {
    ctx.session = { messages: [] };
    await ctx.reply("Сессия обновлена. Жду новых запросов!");
});

bot.command("start", async (ctx) => {
    const isauthorized = config.get("AUTHORIZED_USERS").includes(ctx.message.from.username);
    if (isauthorized) {
        ctx.session = INITIAL_SESSION;
        await ctx.reply("Жду твои голосовые или текстовые сообщения...");
    } else {
        ctx.reply(code("Уходи"));
    }
});

bot.on(message("voice"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    
    try {
        await ctx.reply(code("Жду ответ от сервера"));
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId);
        const mp3Path = await ogg.toMp3(oggPath, userId);

        const text = await openai.transcription(mp3Path);
        removeFile(mp3Path);
        await ctx.reply(code(`Ваш запрос: ${text}`));

        ctx.session.messages.push({ role: openai.roles.USER, content: text });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });

        await ctx.reply(response.content);
    } catch (error) {
        console.log("Error while voice message", error.message);
    }
});

bot.on(message("text"), async (ctx) => {
    if (!ctx.session) {
        ctx.session = INITIAL_SESSION;
    }
    try {
        await ctx.reply(code("Жду ответ от сервера"));

        ctx.session.messages.push({ role: openai.roles.USER, content: ctx.message.text });

        const response = await openai.chat(ctx.session.messages);

        ctx.session.messages.push({ role: openai.roles.ASSISTANT, content: response.content });

        await ctx.reply(response.content);
    } catch (error) {
        console.log("Error while text message", error.message);
    }
});

bot.command("start", async (ctx) => {
    await ctx.reply(JSON.stringify(ctx.message, null, 2));
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
