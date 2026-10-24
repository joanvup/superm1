/* ====== SuperM1 — Física y colisiones ====== */

const Physics = {
    GRAVITY: 0.5,
    MAX_FALL_SPEED: 12,
    MOVE_SPEED: 2.2,
    RUN_SPEED: 3.4,
    JUMP_VELOCITY: -11.5,
    FRICTION: 0.8,
    ACCELERATION: 0.35,

    // Comprueba colisión AABB
    aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },

    /* Mueve la entidad (vx, vy) y resuelve las colisiones con los tiles
       separando ejes: primero X y despues Y. Separar ejes evita el clasico
       fallo de "salir eyectado" cuando se resuelve por el eje de menor
       solapamiento. Devuelve un objeto con lo que ha tocado. */
    moveAndCollide(entity, level) {
        const result = {
            hitFloor: false,
            hitCeiling: false,
            hitWallL: false,
            hitWallR: false,
            ceilingTiles: [], // tiles golpeados desde abajo {tx, ty}
            floorTiles: [],
        };

        // ----- Eje X -----
        entity.x += entity.vx;
        if (entity.vx !== 0) {
            const ts = level.tileSize;
            const x0 = Math.floor(entity.x / ts);
            const x1 = Math.floor((entity.x + entity.width - 0.01) / ts);
            const y0 = Math.floor(entity.y / ts);
            const y1 = Math.floor((entity.y + entity.height - 0.01) / ts);

            let hitTx = null;
            for (let ty = y0; ty <= y1; ty++) {
                for (let tx = x0; tx <= x1; tx++) {
                    if (!level.isSolid(tx, ty)) continue;
                    if (hitTx === null) hitTx = tx;
                    else if (entity.vx > 0) hitTx = Math.min(hitTx, tx);
                    else hitTx = Math.max(hitTx, tx);
                }
            }

            if (hitTx !== null) {
                if (entity.vx > 0) {
                    entity.x = hitTx * ts - entity.width;
                    result.hitWallR = true;
                } else {
                    entity.x = (hitTx + 1) * ts;
                    result.hitWallL = true;
                }
                entity.vx = 0;
            }
        }

        // ----- Eje Y -----
        entity.y += entity.vy;
        if (entity.vy !== 0) {
            const ts = level.tileSize;
            const x0 = Math.floor(entity.x / ts);
            const x1 = Math.floor((entity.x + entity.width - 0.01) / ts);
            const y0 = Math.floor(entity.y / ts);
            const y1 = Math.floor((entity.y + entity.height - 0.01) / ts);

            let hitTy = null;
            for (let ty = y0; ty <= y1; ty++) {
                for (let tx = x0; tx <= x1; tx++) {
                    if (!level.isSolid(tx, ty)) continue;
                    if (hitTy === null) hitTy = ty;
                    else if (entity.vy > 0) hitTy = Math.min(hitTy, ty);
                    else hitTy = Math.max(hitTy, ty);
                }
            }

            if (hitTy !== null) {
                if (entity.vy > 0) {
                    entity.y = hitTy * ts - entity.height;
                    result.hitFloor = true;
                    for (let tx = x0; tx <= x1; tx++) {
                        if (level.isSolid(tx, hitTy)) result.floorTiles.push({ tx, ty: hitTy });
                    }
                } else {
                    entity.y = (hitTy + 1) * ts;
                    result.hitCeiling = true;
                    for (let tx = x0; tx <= x1; tx++) {
                        if (level.isSolid(tx, hitTy)) result.ceilingTiles.push({ tx, ty: hitTy });
                    }
                }
                entity.vy = 0;
            }
        }

        return result;
    },

    /* Version "solo consulta": resuelve contra los tiles sin mover. Se usa
       cuando un cambio de tamano (power-up / dano) deja la entidad dentro
       de un tile. Empuja hacia arriba, que es lo seguro. */
    unstick(entity, level) {
        const ts = level.tileSize;
        let guard = 0;
        while (guard++ < 4) {
            const x0 = Math.floor(entity.x / ts);
            const x1 = Math.floor((entity.x + entity.width - 0.01) / ts);
            const y0 = Math.floor(entity.y / ts);
            const y1 = Math.floor((entity.y + entity.height - 0.01) / ts);

            let overlap = false;
            for (let ty = y0; ty <= y1 && !overlap; ty++) {
                for (let tx = x0; tx <= x1; tx++) {
                    if (level.isSolid(tx, ty)) { overlap = true; break; }
                }
            }
            if (!overlap) return false;
            entity.y = y0 * ts - entity.height;
        }
        return true;
    },
};
