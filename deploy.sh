#!/bin/bash
git add . && git commit -m "$1" && git push && curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_MefKzs2VbODsOs8yPliuel74rrah/0xNEZ96ep8"
echo "✅ Déployé sur Vercel !"
